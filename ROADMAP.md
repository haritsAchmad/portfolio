
# Roadmap

## Kebutuhan sistem di README dan GitHub (diminta pengguna 15 November 2026)

- [ ] README (dan deskripsi repo di GitHub) memuat tabel **minimum** vs
      **rekomendasi**, diukur di mesin nyata (catat mesin ujinya), bukan
      ditebak:
      - Sistem operasi dan versinya (Windows/Linux/macOS).
      - Prosesor (jumlah core, x64/ARM).
      - RAM.
      - GPU/VRAM bila memakai model lokal (Ollama dkk.) -- atau tulis "tidak
        perlu".
      - Ruang disk kosong: aplikasi, model, data, dan cache besar dihitung
        terpisah.
      - Layar/resolusi bila aplikasinya punya GUI.
      - Internet: perlu atau tidak, untuk apa (unduh model sekali, API, dst.).
      - Versi runtime/toolchain untuk membangun (Go, Node, Python, Godot, ...).
      - Software lain yang **wajib** atau **opsional**, beserta ukuran dan
        tautan resminya.
      Untuk repo ini: Node + npm (Vite/Vue) untuk membangun; dideploy ke Vercel, jadi pengunjung tidak butuh apa pun.
