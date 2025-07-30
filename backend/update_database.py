import sqlite3
import os

def update_database():
    """Veritabanı şemasını güncelle"""
    db_path = os.path.join(os.path.dirname(__file__), '..', 'database.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Submission tablosuna is_skipped sütunu ekle
        cursor.execute("""
            ALTER TABLE submissions 
            ADD COLUMN is_skipped BOOLEAN DEFAULT FALSE
        """)
        print("✅ is_skipped sütunu eklendi")
        
        # selected ve is_correct sütunlarını nullable yap
        # SQLite'da ALTER COLUMN yok, bu yüzden tabloyu yeniden oluşturuyoruz
        cursor.execute("PRAGMA foreign_keys=off")
        
        # Geçici tablo oluştur
        cursor.execute("""
            CREATE TABLE submissions_new (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                question_id INTEGER,
                selected TEXT,
                is_correct BOOLEAN,
                is_skipped BOOLEAN DEFAULT FALSE,
                answered_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (question_id) REFERENCES questions (soru_id)
            )
        """)
        
        # Verileri kopyala
        cursor.execute("""
            INSERT INTO submissions_new (id, user_id, question_id, selected, is_correct, is_skipped, answered_at)
            SELECT id, user_id, question_id, selected, is_correct, COALESCE(is_skipped, FALSE), answered_at
            FROM submissions
        """)
        
        # Eski tabloyu sil
        cursor.execute("DROP TABLE submissions")
        
        # Yeni tabloyu yeniden adlandır
        cursor.execute("ALTER TABLE submissions_new RENAME TO submissions")
        
        cursor.execute("PRAGMA foreign_keys=on")
        
        print("✅ Submission tablosu güncellendi")
        
        conn.commit()
        print("✅ Veritabanı güncellemesi tamamlandı")
        
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("ℹ️ is_skipped sütunu zaten mevcut")
        else:
            print(f"❌ Hata: {e}")
    except Exception as e:
        print(f"❌ Beklenmeyen hata: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    update_database() 