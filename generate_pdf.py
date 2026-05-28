import os
from fpdf import FPDF

class PortfolioPDF(FPDF):
    def header(self):
        # Header only on pages after the cover page
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 116, 139) # slate-500
            self.cell(0, 10, 'Panduan Lengkap Pembuatan Web Portofolio Vue 3 + Vite', border=0, align='L')
            self.cell(0, 10, 'Harits.Dev', border=0, align='R')
            self.ln(12)
            self.set_draw_color(226, 232, 240) # slate-200
            self.set_line_width(0.5)
            self.line(10, 20, 200, 20)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(148, 163, 184) # slate-400
        # Centered page number
        self.cell(0, 10, f'Halaman {self.page_no()}', border=0, align='C')

def create_pdf():
    pdf = PortfolioPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    
    # ----------------------------------------------------
    # COVER PAGE
    # ----------------------------------------------------
    pdf.add_page()
    
    # Background decorations on cover
    pdf.set_fill_color(11, 15, 25) # Deep background (slate-950)
    pdf.rect(0, 0, 210, 297, 'F')
    
    # Cover text
    pdf.set_y(80)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(248, 250, 252) # White
    pdf.multi_cell(0, 12, 'PANDUAN LENGKAP\nPEMBUATAN WEB PORTOFOLIO\nPREMIUM VUE 3 + VITE', align='C')
    
    pdf.ln(10)
    # Colored indicator bar
    pdf.set_fill_color(99, 102, 241) # Indigo accent
    pdf.rect(65, 125, 80, 3, 'F')
    
    pdf.set_y(140)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(148, 163, 184) # Light Slate
    pdf.multi_cell(0, 8, 'Panduan Langkah Demi Langkah Menginisialisasi, Mengonfigurasi,\ndan Menjalankan Proyek Portofolio "Full-Spectrum Developer"\ndengan Vue 3, Vite, dan Vanilla CSS', align='C')
    
    pdf.set_y(220)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(248, 250, 252)
    pdf.cell(0, 10, 'Dibuat Khusus Untuk: HARITS.DEV', ln=1, align='C')
    
    pdf.set_font('Helvetica', 'I', 10)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 10, 'Didukung oleh Antigravity AI Coding Assistant', ln=1, align='C')
    
    # ----------------------------------------------------
    # SECTION PAGE 1: PENDAHULUAN
    # ----------------------------------------------------
    pdf.add_page()
    pdf.set_text_color(15, 23, 42) # reset to dark text
    
    pdf.set_font('Helvetica', 'B', 18)
    pdf.cell(0, 12, '1. Latar Belakang & Pendahuluan', ln=1)
    pdf.set_fill_color(99, 102, 241)
    pdf.rect(10, 22, 40, 1.5, 'F')
    pdf.ln(8)
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    
    p1 = ("Portofolio ini dirancang secara khusus untuk memamerkan spektrum keahlian "
          "pengembangan web Anda yang sangat luas dan langka (Full-Spectrum Developer). "
          "Situs portofolio ini menampilkan 4 pilar proyek utama yang membuktikan kompetensi Anda "
          "dalam berbagai teknologi, era, dan arsitektur:")
    pdf.multi_cell(0, 6, p1)
    pdf.ln(4)
    
    # Bullets
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(239, 68, 68) # Red
    pdf.cell(10, 6, 'o', align='C')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, 'SIPEG UI (Anjab & Sicakep):', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, '   Membuktikan kemampuan merawat sistem berskala enterprise, pemrograman backend klasik (PHP 5.3, Symfony 1), serta optimasi database relasional berskala besar (PostgreSQL 8.3).')
    pdf.ln(2)
    
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(99, 102, 241) # Indigo
    pdf.cell(10, 6, 'o', align='C')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, 'SIG System (SMS516 & Koperasig):', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, '   Fokus pada pengembangan modul SMS516 (buat-export-pdf & self-update-bio-attendance) serta Sistem Koperasi internal (Koperasig) berbasis Angular frontend & PHP API backend.')
    pdf.ln(2)
    
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(99, 102, 241) # Indigo
    pdf.cell(10, 6, 'o', align='C')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, 'SI Inventaris SBRC IPB (Laravel):', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, '   Membangun logistik tracker inventarisasi alat & bahan lab berbasis Laravel, MySQL, dan berjalan modern pada PHP 8.2+ untuk mencegah penyimpangan fisik aset lab.')
    pdf.ln(2)
    
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(16, 185, 129) # Emerald
    pdf.cell(10, 6, 'o', align='C')
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, 'Fishee (GIS Platform):', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, '   Membuktikan kemampuan membangun produk interaktif dari awal (Native PHP 7.4, Bootstrap, MySQL) terintegrasi dengan pemetaan geospasial dinamis (Leaflet.js).')
    pdf.ln(4)

    # Why Vite and Vue 3
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, 'Mengapa menggunakan Vue 3 dan Vite?', ln=1)
    pdf.ln(2)
    
    pdf.set_font('Helvetica', '', 10)
    pdf.multi_cell(0, 6, 
        "1. Kecepatan Kilat (Vite): Vite menggunakan teknologi Native ES Modules (ESM) pada browser, "
        "sehingga server lokal langsung jalan secara instan (< 1 detik) tanpa nunggu kompilasi lambat.\n"
        "2. Skalabilitas & Ringan: Vue 3 menggunakan arsitektur modular Composition API yang membuat file hasil build "
        "menjadi sangat kecil (kurang dari 100kb), reaktif, dan performa tinggi.\n"
        "3. Standardisasi Modern: Vue CLI (Webpack) sudah usang. Kombinasi Vue 3 + Vite adalah standar industri modern "
        "yang direkomendasikan secara resmi.")
    pdf.ln(6)

    # ----------------------------------------------------
    # SECTION PAGE 2: INGERIT & INISIALISASI
    # ----------------------------------------------------
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 18)
    pdf.cell(0, 12, '2. Panduan Langkah Demi Langkah (Setup)', ln=1)
    pdf.set_fill_color(99, 102, 241)
    pdf.rect(10, 22, 40, 1.5, 'F')
    pdf.ln(8)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, 'Langkah 1: Inisialisasi Proyek Vue 3 via Vite', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'Buka terminal (PowerShell / CMD) di direktori kerja Anda, lalu jalankan perintah berikut untuk membuat fondasi proyek Vue 3 non-interaktif secara cepat:')
    pdf.ln(2)
    
    # Code block
    pdf.set_font('Courier', '', 9)
    pdf.set_fill_color(241, 245, 249) # slate-100
    pdf.set_text_color(15, 23, 42)
    pdf.multi_cell(0, 5, 'npm create vite@4 portfolio --template vue', border=1, fill=True)
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Langkah 2: Menginstal Dependensi Node Modules', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'Masuk ke dalam folder proyek baru yang telah dibuat, lalu jalankan perintah instalasi paket library dasar:')
    pdf.ln(2)
    
    pdf.set_font('Courier', '', 9)
    pdf.multi_cell(0, 5, 'cd portfolio\nnpm install', border=1, fill=True)
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Langkah 3: Menjalankan Server Pengembangan Lokal', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'Gunakan perintah di bawah untuk menyalakan dev server instan. Buka browser pada alamat yang diberikan (biasanya http://localhost:5173):')
    pdf.ln(2)
    
    pdf.set_font('Courier', '', 9)
    pdf.multi_cell(0, 5, 'npm run dev', border=1, fill=True)
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Langkah 4: Membuat Build Produksi Siap Upload', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'Gunakan perintah di bawah saat situs siap dipublikasikan ke internet. Perintah ini mengompres file HTML, CSS, dan JS secara otomatis ke dalam folder "dist":')
    pdf.ln(2)
    
    pdf.set_font('Courier', '', 9)
    pdf.multi_cell(0, 5, 'npm run build', border=1, fill=True)
    pdf.ln(6)

    # ----------------------------------------------------
    # SECTION PAGE 3: MEMAHAMI STRUKTUR KODE
    # ----------------------------------------------------
    pdf.add_page()
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 12, '3. Memahami Struktur & Logika Kode', ln=1)
    pdf.set_fill_color(99, 102, 241)
    pdf.rect(10, 22, 40, 1.5, 'F')
    pdf.ln(8)
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    p_logika = ("Logika utama dari portofolio ini bertumpu pada sifat reaktivitas Vue 3 "
                "menggunakan Composition API. Mari kita bedah 2 fitur reaktif utama yang "
                "digunakan pada berkas src/App.vue Anda:")
    pdf.multi_cell(0, 6, p_logika)
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'A. Mengelola State Saringan dengan ref()', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'ref() digunakan untuk mendeklarasikan variabel reaktif. Ketika nilai variabel ini berubah (misal ketika user memilih kategori "modern-spa"), Vue mendeteksi perubahan tersebut dan merender ulang kartu proyek yang sesuai secara instan:')
    pdf.ln(2)
    
    code_ref = (
        "// src/App.vue\n"
        "import { ref } from 'vue';\n"
        "const activeFilter = ref('all'); // State reaktif default 'all'\n\n"
        "const handleFilterChange = (newFilter) => {\n"
        "  activeFilter.value = newFilter; // Mengubah nilai reaktif via .value\n"
        "};"
    )
    pdf.set_font('Courier', '', 8.5)
    pdf.multi_cell(0, 5, code_ref, border=1, fill=True)
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, 'B. Melakukan Penyaringan dengan computed()', ln=1)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(0, 6, 'computed() membuat properti komputasi yang otomatis terhitung ulang di memori cache hanya ketika variabel reaktif di dalamnya (yaitu activeFilter) berubah. Ini menghemat pemrosesan memori browser secara signifikan:')
    pdf.ln(2)
    
    code_comp = (
        "// src/App.vue\n"
        "import { computed } from 'vue';\n"
        "import { projects } from './data/projects';\n\n"
        "const filteredProjects = computed(() => {\n"
        "  if (activeFilter.value === 'all') {\n"
        "    return projects; // Kembalikan semua data proyek\n"
        "  }\n"
        "  // Saring data array berdasarkan kategori aktif\n"
        "  return projects.filter(p => p.category === activeFilter.value);\n"
        "});"
    )
    pdf.set_font('Courier', '', 8.5)
    pdf.multi_cell(0, 5, code_comp, border=1, fill=True)
    pdf.ln(6)

    # Save PDF
    output_path = os.path.join("C:\\Users\\HaritsAF\\Videos\\portfolio", "Panduan_Web_Portofolio.pdf")
    pdf.output(output_path)
    print(f"PDF successfully created at: {output_path}")

if __name__ == "__main__":
    create_pdf()
