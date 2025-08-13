/**
 * Data Validation Engine
 * Validates data integrity before and after migration
 */

import { PrismaClient } from '@prisma/client';

export interface ValidationRule {
  name: string;
  description: string;
  query: string;
  severity: 'error' | 'warning' | 'info';
  threshold?: number;
}

export interface ValidationResult {
  rule: string;
  severity: 'error' | 'warning' | 'info';
  passed: boolean;
  count: number;
  threshold?: number;
  message: string;
  details?: any[];
}

export interface ValidationReport {
  timestamp: Date;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  warningRules: number;
  results: ValidationResult[];
  overallStatus: 'pass' | 'warning' | 'fail';
}

export class ValidationEngine {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Pre-migration validation rules
   */
  private getPreMigrationRules(): ValidationRule[] {
    return [
      {
        name: 'duplicate_niks',
        description: 'Check for duplicate NIK entries in source data',
        query: `
          SELECT nik, COUNT(*) as count 
          FROM tweb_penduduk 
          GROUP BY nik 
          HAVING COUNT(*) > 1
        `,
        severity: 'error',
        threshold: 0
      },
      {
        name: 'invalid_nik_format',
        description: 'Check for invalid NIK formats (not 16 digits)',
        query: `
          SELECT id, nik 
          FROM tweb_penduduk 
          WHERE LENGTH(nik) != 16 OR nik NOT REGEXP '^[0-9]+$'
        `,
        severity: 'warning',
        threshold: 10
      },
      {
        name: 'missing_family_heads',
        description: 'Check for families without head of family',
        query: `
          SELECT k.id, k.no_kk 
          FROM tweb_keluarga k 
          LEFT JOIN tweb_penduduk p ON k.id = p.id_kk AND p.kk_level = 1 
          WHERE p.id IS NULL
        `,
        severity: 'warning',
        threshold: 5
      },
      {
        name: 'orphaned_citizens',
        description: 'Check for citizens with invalid family references',
        query: `
          SELECT p.id, p.nama, p.id_kk 
          FROM tweb_penduduk p 
          LEFT JOIN tweb_keluarga k ON p.id_kk = k.id 
          WHERE p.id_kk IS NOT NULL AND k.id IS NULL
        `,
        severity: 'error',
        threshold: 0
      },
      {
        name: 'invalid_birth_dates',
        description: 'Check for invalid birth dates (future dates or before 1900)',
        query: `
          SELECT id, nama, tanggallahir 
          FROM tweb_penduduk 
          WHERE tanggallahir > CURDATE() OR tanggallahir < '1900-01-01'
        `,
        severity: 'warning',
        threshold: 5
      }
    ];
  }

  /**
   * Post-migration validation rules
   */
  private getPostMigrationRules(): ValidationRule[] {
    return [
      {
        name: 'citizen_count_match',
        description: 'Verify citizen count matches between source and target',
        query: 'SELECT COUNT(*) as count FROM citizens',
        severity: 'error'
      },
      {
        name: 'family_count_match',
        description: 'Verify family count matches between source and target',
        query: 'SELECT COUNT(*) as count FROM families',
        severity: 'error'
      },
      {
        name: 'user_count_match',
        description: 'Verify user count matches between source and target',
        query: 'SELECT COUNT(*) as count FROM users',
        severity: 'error'
      },
      {
        name: 'duplicate_niks_target',
        description: 'Check for duplicate NIKs in target database',
        query: `
          SELECT nik, COUNT(*) as count 
          FROM citizens 
          GROUP BY nik 
          HAVING COUNT(*) > 1
        `,
        severity: 'error',
        threshold: 0
      },
      {
        name: 'families_without_head',
        description: 'Check for families without head in target database',
        query: `
          SELECT f.id, f.family_number 
          FROM families f 
          LEFT JOIN citizens c ON f.id = c.family_id AND c.is_head_of_family = true 
          WHERE c.id IS NULL
        `,
        severity: 'warning',
        threshold: 5
      },
      {
        name: 'orphaned_citizens_target',
        description: 'Check for citizens with invalid family references in target',
        query: `
          SELECT c.id, c.name, c.family_id 
          FROM citizens c 
          LEFT JOIN families f ON c.family_id = f.id 
          WHERE c.family_id IS NOT NULL AND f.id IS NULL
        `,
        severity: 'error',
        threshold: 0
      },
      {
        name: 'missing_created_by',
        description: 'Check for citizens without valid createdBy references',
        query: `
          SELECT c.id, c.name 
          FROM citizens c 
          LEFT JOIN users u ON c.created_by_id = u.id 
          WHERE u.id IS NULL
        `,
        severity: 'error',
        threshold: 0
      }
    ];
  }

  /**
   * Run pre-migration validation
   */
  async validatePreMigration(mysqlConnection: any): Promise<ValidationReport> {
    console.log('🔍 Running pre-migration validation...');
    
    const rules = this.getPreMigrationRules();
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      try {
        const queryResult = await mysqlConnection.query(rule.query);
        const count = Array.isArray(queryResult) ? queryResult.length : 0;
        
        const passed = rule.threshold !== undefined ? count <= rule.threshold : count === 0;
        
        results.push({
          rule: rule.name,
          severity: rule.severity,
          passed,
          count,
          threshold: rule.threshold,
          message: passed 
            ? `✅ ${rule.description}: ${count} issues found (within threshold)`
            : `❌ ${rule.description}: ${count} issues found (exceeds threshold: ${rule.threshold})`,
          details: Array.isArray(queryResult) ? queryResult.slice(0, 5) : []
        });

        console.log(`   ${results[results.length - 1].message}`);
        
      } catch (error) {
        results.push({
          rule: rule.name,
          severity: 'error',
          passed: false,
          count: -1,
          message: `❌ ${rule.description}: Validation failed - ${error.message}`
        });
      }
    }

    return this.generateReport(results);
  }

  /**
   * Run post-migration validation
   */
  async validatePostMigration(sourceCounts?: Record<string, number>): Promise<ValidationReport> {
    console.log('🔍 Running post-migration validation...');
    
    const rules = this.getPostMigrationRules();
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      try {
        let passed = true;
        let count = 0;
        let message = '';

        if (rule.name.includes('count_match') && sourceCounts) {
          // Special handling for count matching rules
          const result = await this.prisma.$queryRawUnsafe(rule.query) as any[];
          count = result[0]?.count || 0;
          
          const tableName = rule.name.replace('_count_match', '');
          const sourceCount = sourceCounts[tableName] || 0;
          
          passed = count === sourceCount;
          message = passed 
            ? `✅ ${rule.description}: ${count} records (matches source: ${sourceCount})`
            : `❌ ${rule.description}: ${count} records (source: ${sourceCount}, difference: ${Math.abs(count - sourceCount)})`;
            
        } else {
          // Regular validation rules
          const queryResult = await this.prisma.$queryRawUnsafe(rule.query) as any[];
          count = Array.isArray(queryResult) ? queryResult.length : 0;
          
          passed = rule.threshold !== undefined ? count <= rule.threshold : count === 0;
          message = passed 
            ? `✅ ${rule.description}: ${count} issues found (within threshold)`
            : `❌ ${rule.description}: ${count} issues found (exceeds threshold: ${rule.threshold})`;
        }

        results.push({
          rule: rule.name,
          severity: rule.severity,
          passed,
          count,
          threshold: rule.threshold,
          message
        });

        console.log(`   ${message}`);
        
      } catch (error) {
        results.push({
          rule: rule.name,
          severity: 'error',
          passed: false,
          count: -1,
          message: `❌ ${rule.description}: Validation failed - ${error.message}`
        });
      }
    }

    return this.generateReport(results);
  }

  /**
   * Generate validation report
   */
  private generateReport(results: ValidationResult[]): ValidationReport {
    const totalRules = results.length;
    const passedRules = results.filter(r => r.passed).length;
    const failedRules = results.filter(r => !r.passed && r.severity === 'error').length;
    const warningRules = results.filter(r => !r.passed && r.severity === 'warning').length;

    const overallStatus = failedRules > 0 ? 'fail' : 
                         warningRules > 0 ? 'warning' : 'pass';

    return {
      timestamp: new Date(),
      totalRules,
      passedRules,
      failedRules,
      warningRules,
      results,
      overallStatus
    };
  }

  /**
   * Fix common data issues
   */
  async fixDataIssues(): Promise<string[]> {
    const fixes: string[] = [];

    try {
      // Fix families without head of family
      const familiesWithoutHead = await this.prisma.family.findMany({
        where: {
          members: {
            none: {
              isHeadOfFamily: true
            }
          }
        },
        include: {
          members: {
            orderBy: { createdAt: 'asc' },
            take: 1
          }
        }
      });

      for (const family of familiesWithoutHead) {
        if (family.members.length > 0) {
          await this.prisma.citizen.update({
            where: { id: family.members[0].id },
            data: { isHeadOfFamily: true }
          });
          fixes.push(`Set ${family.members[0].name} as head of family ${family.familyNumber}`);
        }
      }

      // Fix invalid NIK formats (pad with zeros)
      const invalidNiks = await this.prisma.citizen.findMany({
        where: {
          OR: [
            { nik: { not: { regex: '^[0-9]{16}$' } } },
            { nik: { length: { lt: 16 } } }
          ]
        }
      });

      for (const citizen of invalidNiks) {
        const paddedNik = citizen.nik.padStart(16, '0');
        if (paddedNik.length === 16 && /^[0-9]+$/.test(paddedNik)) {
          await this.prisma.citizen.update({
            where: { id: citizen.id },
            data: { nik: paddedNik }
          });
          fixes.push(`Fixed NIK format for ${citizen.name}: ${citizen.nik} -> ${paddedNik}`);
        }
      }

      // Remove orphaned citizens (citizens with invalid family references)
      const orphanedCitizens = await this.prisma.citizen.findMany({
        where: {
          familyId: { not: null },
          family: null
        }
      });

      for (const citizen of orphanedCitizens) {
        await this.prisma.citizen.update({
          where: { id: citizen.id },
          data: { familyId: null, isHeadOfFamily: false }
        });
        fixes.push(`Removed invalid family reference for ${citizen.name}`);
      }

    } catch (error) {
      fixes.push(`Error during data fixes: ${error.message}`);
    }

    return fixes;
  }

  /**
   * Generate data quality report
   */
  async generateDataQualityReport(): Promise<any> {
    const report = {
      timestamp: new Date(),
      statistics: {},
      issues: {},
      recommendations: []
    };

    try {
      // Basic statistics
      const [citizenCount, familyCount, userCount] = await Promise.all([
        this.prisma.citizen.count(),
        this.prisma.family.count(),
        this.prisma.user.count()
      ]);

      report.statistics = {
        totalCitizens: citizenCount,
        totalFamilies: familyCount,
        totalUsers: userCount,
        averageFamilySize: familyCount > 0 ? Math.round((citizenCount / familyCount) * 100) / 100 : 0
      };

      // Data quality issues
      const [duplicateNiks, familiesWithoutHead, citizensWithoutFamily] = await Promise.all([
        this.prisma.$queryRaw`
          SELECT COUNT(*) as count 
          FROM (
            SELECT nik 
            FROM citizens 
            GROUP BY nik 
            HAVING COUNT(*) > 1
          ) as duplicates
        `,
        this.prisma.family.count({
          where: {
            members: {
              none: {
                isHeadOfFamily: true
              }
            }
          }
        }),
        this.prisma.citizen.count({
          where: { familyId: null }
        })
      ]);

      report.issues = {
        duplicateNiks: Array.isArray(duplicateNiks) ? duplicateNiks[0]?.count || 0 : 0,
        familiesWithoutHead,
        citizensWithoutFamily
      };

      // Generate recommendations
      if (report.issues.duplicateNiks > 0) {
        report.recommendations.push('Review and resolve duplicate NIK entries');
      }
      if (report.issues.familiesWithoutHead > 0) {
        report.recommendations.push('Assign head of family for families without one');
      }
      if (report.issues.citizensWithoutFamily > 10) {
        report.recommendations.push('Consider creating family records for citizens without families');
      }

    } catch (error) {
      report.issues.error = error.message;
    }

    return report;
  }
}