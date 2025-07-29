import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
import json
from sqlalchemy.orm import Session
from backend.app.database import SessionLocal
from backend.app.models import Questions

JSON_PATH = "Tarih-Yeni.json"

with open(JSON_PATH, "r", encoding="utf-8") as f:
    questions = json.load(f)

db: Session = SessionLocal()
for q in questions:
    secenekler = q["secenekler"]
    choice_e   = secenekler.get("E", "")
    tags       = ", ".join(q.get("etiketler", []))
    alt_id     = q.get("altbaslik_id", None)
    img_url    = q.get("image_url") or q.get("gorsel_url")
    dogru_cevap_aciklamasi = q.get("dogru_cevap_aciklamasi", "")

    soru = Questions(
        ders_id       = q["ders_id"],
        konu_id       = q["konu_id"],
        tags          = tags,
        altbaslik_id  = alt_id,
        gorsel_url    = img_url,
        zorluk        = q["zorluk"],
        soru_metin    = q["soru_metni"],
        choice_a      = secenekler.get("A", ""),
        choice_b      = secenekler.get("B", ""),
        choice_c      = secenekler.get("C", ""),
        choice_d      = secenekler.get("D", ""),
        choice_e      = choice_e,
        correct_choice= q["dogru_cevap"],
        dogru_cevap_aciklamasi=dogru_cevap_aciklamasi
    )
    db.add(soru)

db.commit()
db.close()
print("Sorular başarıyla eklendi!")
