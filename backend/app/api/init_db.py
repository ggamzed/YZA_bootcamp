from app.core.database import Base, engine
from app.core.models import Questions, User, Submission

print("🔄 Veritabanı sıfırlanıyor...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("✅ Tüm tablolar başarıyla oluşturuldu.")
