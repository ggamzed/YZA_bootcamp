import sys
import os
import json
from sqlalchemy.orm import Session

# Proje kök dizinini Python yoluna ekle
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Backend dizininden çalıştırıldığı için doğrudan app modülünü import et
from app.database import SessionLocal
from app.models import Questions

def import_questions_from_json(json_path):
    """
    Belirtilen JSON dosyasından soruları veritabanına aktarır.
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            questions_data = json.load(f)
    except FileNotFoundError:
        print(f"Hata: '{json_path}' dosyası bulunamadı.")
        return
    except json.JSONDecodeError:
        print(f"Hata: '{json_path}' dosyası geçerli bir JSON formatında değil.")
        return

    db: Session = SessionLocal()
    count = 0
    try:
        for q in questions_data:
            # Gerekli alanların varlığını kontrol et
            required_fields = ["ders_id", "konu_id", "zorluk", "soru_metni", "secenekler", "dogru_cevap"]
            if not all(k in q for k in required_fields):
                print(f"Uyarı: Eksik anahtar içeren soru atlandı: {q.get('soru_metni', 'Bilinmeyen Soru')[:50]}...")
                continue

            # secenekler sözlüğünü JSON string'ine dönüştür
            secenekler_str = json.dumps(q.get("secenekler", {}), ensure_ascii=False)
            
            # etiketler listesini string'e dönüştür
            etiket_str = ", ".join(q.get("etiketler", []))

            soru = Questions(
                ders_id=q["ders_id"],
                konu_id=q["konu_id"],
                altbaslik_id=q.get("altbaslik_id"),
                soru_metin=q["soru_metni"],
                secenekler=secenekler_str,
                dogru_cevap=q["dogru_cevap"],
                dogru_cevap_aciklamasi=q.get("dogru_cevap_aciklamasi", ""),
                zorluk=q["zorluk"],
                etiket=etiket_str
            )
            db.add(soru)
            count += 1
        
        db.commit()
        print(f"Başarıyla {count} soru '{os.path.basename(json_path)}' dosyasından eklendi!")

    except Exception as e:
        print(f"Veritabanına ekleme sırasında bir hata oluştu: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # ImportQuestions klasöründeki tüm .json dosyalarını bul
    questions_dir = os.path.dirname(os.path.abspath(__file__))
    json_files = [f for f in os.listdir(questions_dir) if f.endswith('.json')]

    if not json_files:
        print("Import edilecek JSON dosyası bulunamadı.")
    else:
        print(f"Toplam {len(json_files)} JSON dosyası bulundu:")
        for json_file in json_files:
            print(f"  - {json_file}")
        
        print("\nSorular veritabanına aktarılıyor...")
        for json_file in json_files:
            full_path = os.path.join(questions_dir, json_file)
            print(f"\n--- {json_file} dosyası işleniyor ---")
            import_questions_from_json(full_path)
        
        print("\nTüm dosyalar işlendi!")
