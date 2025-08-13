/**
 * MySQL Connection for Data Migration
 * Handles connection to the legacy OpenSID MySQL database
 */

import mysql from 'mysql2/promise'

export interface MySQLConfig {
    host: string
    port: number
    user: string
    password: string
    database: string
}

export class MySQLConnection {
    private connection: mysql.Connection | null = null
    private config: MySQLConfig

    constructor(config: MySQLConfig) {
        this.config = config
    }

    async connect(): Promise<void> {
        try {
            this.connection = await mysql.createConnection({
                host: this.config.host,
                port: this.config.port,
                user: this.config.user,
                password: this.config.password,
                database: this.config.database,
                charset: 'utf8mb4',
                timezone: '+00:00'
            })

            console.log('✅ Connected to MySQL database')
        } catch (error) {
            console.error('❌ Failed to connect to MySQL:', error)
            throw error
        }
    }

    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.end()
            this.connection = null
            console.log('✅ Disconnected from MySQL database')
        }
    }

    async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
        if (!this.connection) {
            throw new Error('MySQL connection not established')
        }

        try {
            const [rows] = await this.connection.execute(sql, params)
            return rows as T[]
        } catch (error) {
            console.error('❌ MySQL query error:', error)
            throw error
        }
    }

    async getTableSchema(tableName: string): Promise<any[]> {
        return this.query(`DESCRIBE ${tableName}`)
    }

    async getTableCount(tableName: string): Promise<number> {
        const result = await this.query(`SELECT COUNT(*) as count FROM ${tableName}`)
        return result[0]?.count || 0
    }

    async getAllTables(): Promise<string[]> {
        const result = await this.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      ORDER BY TABLE_NAME
    `, [this.config.database])

        return result.map((row: any) => row.TABLE_NAME)
    }

    async getTableData(tableName: string, limit?: number, offset?: number): Promise<any[]> {
        let sql = `SELECT * FROM ${tableName}`
        const params: any[] = []

        if (limit) {
            sql += ` LIMIT ?`
            params.push(limit)

            if (offset) {
                sql += ` OFFSET ?`
                params.push(offset)
            }
        }

        return this.query(sql, params)
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.query('SELECT 1')
            return true
        } catch (error) {
            return false
        }
    }
}

// Default configuration from environment variables
export function createMySQLConnection(): MySQLConnection {
    const config: MySQLConfig = {
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        user: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || '',
        database: process.env.MYSQL_DATABASE || 'opensid'
    }

    return new MySQLConnection(config)
}