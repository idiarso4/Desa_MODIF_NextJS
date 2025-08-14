/**
 * PDF Document Templates
 * Contains templates for various administrative documents
 */

export interface TemplateData {
  village: {
    name: string
    district: string
    regency: string
    province: string
    postalCode: string
    phone?: string
    email?: string
    website?: string
  }
  official: {
    name: string
    position: string
    nip?: string
  }
  citizen?: {
    nik: string
    name: string
    birthPlace: string
    birthDate: string
    gender: string
    religion: string
    occupation: string
    address: string
    rt: string
    rw: string
  }
  document: {
    number: string
    date: string
    purpose: string
    validUntil?: string
  }
  additional?: Record<string, any>
}

export const DocumentTemplates = {
  // Template untuk Surat Keterangan Domisili
  domicileCertificate: `
    <div class="header">
      <h1>Pemerintah Desa {{village.name}}</h1>
      <h2>Kecamatan {{village.district}}</h2>
      <h2>Kabupaten {{village.regency}}</h2>
      <div class="address">
        {{village.province}} {{village.postalCode}}
        {{#if village.phone}}<br>Telp: {{village.phone}}{{/if}}
        {{#if village.email}}<br>Email: {{village.email}}{{/if}}
      </div>
    </div>

    <div class="content">
      <div class="text-center mb-4">
        <h3 class="font-bold uppercase underline">Surat Keterangan Domisili</h3>
        <p>Nomor: {{document.number}}</p>
      </div>

      <p class="mb-3">Yang bertanda tangan di bawah ini:</p>
      
      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{official.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Jabatan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{official.position}}</td>
        </tr>
        {{#if official.nip}}
        <tr style="border: none;">
          <td style="border: none;">NIP</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{official.nip}}</td>
        </tr>
        {{/if}}
      </table>

      <p class="mb-3">Dengan ini menerangkan bahwa:</p>

      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{citizen.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">NIK</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.nik}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Tempat/Tgl Lahir</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.birthPlace}}, {{citizen.birthDate}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Jenis Kelamin</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.gender}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Agama</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.religion}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Pekerjaan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.occupation}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Alamat</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.address}}, RT {{citizen.rt}}/RW {{citizen.rw}}, Desa {{village.name}}</td>
        </tr>
      </table>

      <p class="mb-3">
        Adalah benar-benar penduduk Desa {{village.name}} dan berdomisili di alamat tersebut di atas.
      </p>

      <p class="mb-3">
        Surat keterangan ini dibuat untuk keperluan <strong>{{document.purpose}}</strong>.
      </p>

      {{#if document.validUntil}}
      <p class="mb-3">
        Surat keterangan ini berlaku sampai dengan tanggal {{document.validUntil}}.
      </p>
      {{/if}}

      <p class="mb-4">
        Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      <div class="signature-section">
        <div class="signature-box"></div>
        <div class="signature-box">
          <p>{{village.name}}, {{document.date}}</p>
          <p>{{official.position}}</p>
          <div class="signature-line"></div>
          <p class="font-bold">{{official.name}}</p>
          {{#if official.nip}}
          <p>NIP. {{official.nip}}</p>
          {{/if}}
        </div>
      </div>
    </div>
  `,

  // Template untuk Surat Keterangan Usaha
  businessCertificate: `
    <div class="header">
      <h1>Pemerintah Desa {{village.name}}</h1>
      <h2>Kecamatan {{village.district}}</h2>
      <h2>Kabupaten {{village.regency}}</h2>
      <div class="address">
        {{village.province}} {{village.postalCode}}
        {{#if village.phone}}<br>Telp: {{village.phone}}{{/if}}
        {{#if village.email}}<br>Email: {{village.email}}{{/if}}
      </div>
    </div>

    <div class="content">
      <div class="text-center mb-4">
        <h3 class="font-bold uppercase underline">Surat Keterangan Usaha</h3>
        <p>Nomor: {{document.number}}</p>
      </div>

      <p class="mb-3">Yang bertanda tangan di bawah ini:</p>
      
      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{official.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Jabatan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{official.position}}</td>
        </tr>
      </table>

      <p class="mb-3">Dengan ini menerangkan bahwa:</p>

      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{citizen.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">NIK</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.nik}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Alamat</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.address}}, RT {{citizen.rt}}/RW {{citizen.rw}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Jenis Usaha</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{additional.businessType}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Alamat Usaha</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{additional.businessAddress}}</td>
        </tr>
        {{#if additional.businessStartDate}}
        <tr style="border: none;">
          <td style="border: none;">Mulai Usaha</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{additional.businessStartDate}}</td>
        </tr>
        {{/if}}
      </table>

      <p class="mb-3">
        Adalah benar-benar warga Desa {{village.name}} dan memiliki usaha {{additional.businessType}} 
        di {{additional.businessAddress}}.
      </p>

      <p class="mb-3">
        Surat keterangan ini dibuat untuk keperluan <strong>{{document.purpose}}</strong>.
      </p>

      <p class="mb-4">
        Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      <div class="signature-section">
        <div class="signature-box"></div>
        <div class="signature-box">
          <p>{{village.name}}, {{document.date}}</p>
          <p>{{official.position}}</p>
          <div class="signature-line"></div>
          <p class="font-bold">{{official.name}}</p>
        </div>
      </div>
    </div>
  `,

  // Template untuk Surat Keterangan Tidak Mampu
  povertyLetter: `
    <div class="header">
      <h1>Pemerintah Desa {{village.name}}</h1>
      <h2>Kecamatan {{village.district}}</h2>
      <h2>Kabupaten {{village.regency}}</h2>
      <div class="address">
        {{village.province}} {{village.postalCode}}
        {{#if village.phone}}<br>Telp: {{village.phone}}{{/if}}
      </div>
    </div>

    <div class="content">
      <div class="text-center mb-4">
        <h3 class="font-bold uppercase underline">Surat Keterangan Tidak Mampu</h3>
        <p>Nomor: {{document.number}}</p>
      </div>

      <p class="mb-3">Yang bertanda tangan di bawah ini:</p>
      
      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{official.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Jabatan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{official.position}}</td>
        </tr>
      </table>

      <p class="mb-3">Dengan ini menerangkan bahwa:</p>

      <table style="border: none; margin-bottom: 20px;">
        <tr style="border: none;">
          <td style="border: none; width: 150px;">Nama</td>
          <td style="border: none; width: 20px;">:</td>
          <td style="border: none;">{{citizen.name}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">NIK</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.nik}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Tempat/Tgl Lahir</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.birthPlace}}, {{citizen.birthDate}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Pekerjaan</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.occupation}}</td>
        </tr>
        <tr style="border: none;">
          <td style="border: none;">Alamat</td>
          <td style="border: none;">:</td>
          <td style="border: none;">{{citizen.address}}, RT {{citizen.rt}}/RW {{citizen.rw}}</td>
        </tr>
      </table>

      <p class="mb-3">
        Adalah benar-benar warga Desa {{village.name}} yang tergolong keluarga <strong>TIDAK MAMPU</strong> 
        secara ekonomi.
      </p>

      <p class="mb-3">
        Surat keterangan ini dibuat untuk keperluan <strong>{{document.purpose}}</strong>.
      </p>

      <p class="mb-4">
        Demikian surat keterangan ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagaimana mestinya.
      </p>

      <div class="signature-section">
        <div class="signature-box"></div>
        <div class="signature-box">
          <p>{{village.name}}, {{document.date}}</p>
          <p>{{official.position}}</p>
          <div class="signature-line"></div>
          <p class="font-bold">{{official.name}}</p>
        </div>
      </div>
    </div>
  `
}

export type TemplateType = keyof typeof DocumentTemplates
