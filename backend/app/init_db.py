# initdb.py

from backend.app.database import Base, engine
# Modelleri import ederek metadata'ya kaydet
from backend.app import models

# Tüm tabloları (models içindeki) yarat
Base.metadata.create_all(bind=engine)
print("Tablolar başarıyla oluşturuldu.")
