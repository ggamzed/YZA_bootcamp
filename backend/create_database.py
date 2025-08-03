import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import sqlite3

def create_database():
    # Use the same database path as the app
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.join(current_dir, 'app')
    db_path = os.path.join(app_dir, 'database.db')
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                email TEXT UNIQUE,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                birth_date DATETIME,
                role TEXT,
                hashed_password TEXT,
                profile_picture TEXT DEFAULT 'kurbaga.jpeg',
                reset_token TEXT,
                reset_token_expires DATETIME,
                show_profile BOOLEAN DEFAULT TRUE,
                show_stats BOOLEAN DEFAULT TRUE,
                hide_ai_recommendations BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS questions (
                soru_id INTEGER PRIMARY KEY,
                ders_id INTEGER,
                konu_id INTEGER,
                altbaslik_id INTEGER,
                soru_metin TEXT,
                secenekler TEXT,
                dogru_cevap TEXT,
                dogru_cevap_aciklamasi TEXT,
                zorluk INTEGER,
                etiket TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS test_sessions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                ders_id INTEGER,
                etiket TEXT,
                started_at DATETIME,
                ended_at DATETIME,
                is_completed BOOLEAN DEFAULT FALSE,
                total_questions INTEGER DEFAULT 0,
                correct_answers INTEGER DEFAULT 0,
                incorrect_answers INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id INTEGER PRIMARY KEY,
                user_id INTEGER,
                question_id INTEGER,
                test_session_id INTEGER,
                selected TEXT,
                is_correct BOOLEAN,
                is_skipped BOOLEAN DEFAULT FALSE,
                answered_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (question_id) REFERENCES questions (soru_id),
                FOREIGN KEY (test_session_id) REFERENCES test_sessions (id)
            )
        """)
        
        conn.commit()
        print("✅ Veritabanı tabloları oluşturuldu")
        
    except Exception as e:
        print(f"❌ Hata: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    create_database() 