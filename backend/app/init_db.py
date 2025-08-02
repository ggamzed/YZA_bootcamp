# db_reset.py
from app.database import Base, engine
from app.models import Questions, User, Submission

print("🔄 Veritabanı sıfırlanıyor...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("✅ Tüm tablolar başarıyla oluşturuldu.")
