import os
import pickle
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict

from river import compose, linear_model, preprocessing

class EnhancedPracticeModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "enhanced_model.pkl")
        self.user_stats_path = os.path.join(os.path.dirname(__file__), "user_stats.pkl")
        
        self.user_stats = self.load_user_stats()
        self.data_cleanup_threshold = 1000  # Veri temizleme eşiği
        self.data_cleanup_percentage = 0.25  # Silinecek veri yüzdesi (%25)
        
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
            except (EOFError, pickle.UnpicklingError, FileNotFoundError):
                try:
                    os.remove(self.model_path)
                except:
                    pass
                print("⚠️ Bozuk enhanced_model.pkl dosyası silindi, yeni model oluşturuluyor...")
                self.create_enhanced_model()
        else:
            self.create_enhanced_model()
    
    def load_user_stats(self):
        if os.path.exists(self.user_stats_path):
            try:
                with open(self.user_stats_path, "rb") as f:
                    return pickle.load(f)
            except (EOFError, pickle.UnpicklingError, FileNotFoundError):
                try:
                    os.remove(self.user_stats_path)
                except:
                    pass
                print("⚠️ Bozuk user_stats.pkl dosyası silindi, yeni dosya oluşturuluyor...")
        
        return defaultdict(self._create_user_data)
    
    def _create_user_data(self):
        return {
            'total_questions': 0,
            'correct_answers': 0,
            'subject_performance': defaultdict(self._create_performance_data),
            'topic_performance': defaultdict(self._create_performance_data),
            'difficulty_performance': defaultdict(self._create_performance_data),
            'recent_performance': [],
            'learning_curve': [],
            'last_activity': None,
            'question_history': [],  # Soru geçmişini takip etmek için
            'last_cleanup_at': 0  # Son temizleme yapılan soru sayısı
        }
    
    def _create_performance_data(self):
        return {'total': 0, 'correct': 0}
    
    def save_user_stats(self):
        with open(self.user_stats_path, "wb") as f:
            pickle.dump(self.user_stats, f)
    
    def cleanup_old_data(self, user_id):
        """Kullanıcı her 1000'in katına ulaştığında en eski %25 veriyi temizle"""
        user_data = self.user_stats[user_id]
        
        # Her 1000'in katında temizleme yap
        if user_data['total_questions'] > 0 and user_data['total_questions'] % self.data_cleanup_threshold == 0:
            # Son temizleme yapılan yerden farklı olmalı
            if user_data['last_cleanup_at'] != user_data['total_questions']:
                print(f"🧹 Enhanced Model - Veri temizleme başlatılıyor - Kullanıcı {user_id}: {user_data['total_questions']} soru (1000'in katı)")
                
                # En eski %25 soruyu temizle
                questions_to_remove = int(user_data['total_questions'] * self.data_cleanup_percentage)
                
                # Genel istatistikleri güncelle
                user_data['total_questions'] -= questions_to_remove
                
                # Doğru cevap sayısını orantılı olarak azalt
                overall_accuracy = user_data['correct_answers'] / (user_data['total_questions'] + questions_to_remove)
                user_data['correct_answers'] = int(user_data['total_questions'] * overall_accuracy)
                
                # Konu bazlı performansı güncelle
                for ders_id, subject_data in user_data['subject_performance'].items():
                    if subject_data['total'] > 0:
                        subject_accuracy = subject_data['correct'] / subject_data['total']
                        remove_from_subject = min(questions_to_remove // len(user_data['subject_performance']), subject_data['total'])
                        
                        subject_data['total'] -= remove_from_subject
                        subject_data['correct'] = int(subject_data['total'] * subject_accuracy)
                
                # Konu bazlı performansı güncelle
                for topic_key, topic_data in user_data['topic_performance'].items():
                    if topic_data['total'] > 0:
                        topic_accuracy = topic_data['correct'] / topic_data['total']
                        remove_from_topic = min(questions_to_remove // len(user_data['topic_performance']), topic_data['total'])
                        
                        topic_data['total'] -= remove_from_topic
                        topic_data['correct'] = int(topic_data['total'] * topic_accuracy)
                
                # Zorluk bazlı performansı güncelle
                for difficulty, diff_data in user_data['difficulty_performance'].items():
                    if diff_data['total'] > 0:
                        diff_accuracy = diff_data['correct'] / diff_data['total']
                        remove_from_diff = min(questions_to_remove // len(user_data['difficulty_performance']), diff_data['total'])
                        
                        diff_data['total'] -= remove_from_diff
                        diff_data['correct'] = int(diff_data['total'] * diff_accuracy)
                
                # Son performans listesini koru (en son 10 veri)
                if len(user_data['recent_performance']) > 10:
                    user_data['recent_performance'] = user_data['recent_performance'][-10:]
                
                # Öğrenme eğrisini güncelle (son 100 veri)
                if len(user_data['learning_curve']) > 100:
                    user_data['learning_curve'] = user_data['learning_curve'][-100:]
                
                # Son temizleme yapılan yeri kaydet
                user_data['last_cleanup_at'] = user_data['total_questions'] + questions_to_remove
                
                print(f"✅ Enhanced Model - Veri temizleme tamamlandı - Kullanıcı {user_id}: {user_data['total_questions']} soru kaldı")
                print(f"📊 Temizleme sonrası başarı oranı: %{user_data['correct_answers'] / user_data['total_questions'] * 100:.1f}")
                
                # Güncellenmiş verileri kaydet
                self.save_user_stats()
    
    def create_enhanced_model(self):
        num_features = ['zorluk', 'user_accuracy', 'subject_accuracy', 'topic_accuracy', 'difficulty_accuracy']
        cat_features = ['ders_id', 'konu_id', 'altbaslik_id']
        
        num_pipeline = compose.Select(*num_features) | preprocessing.StandardScaler()
        
        cat_pipeline = compose.Select(*cat_features) | preprocessing.OneHotEncoder()
        
        feature_pipeline = compose.TransformerUnion(
            num_pipeline,
            cat_pipeline
        )
        
        self.model = feature_pipeline | linear_model.LinearRegression()
    
    def extract_features(self, X, user_id):
        user_data = self.user_stats[user_id]
        
        features = {
            'ders_id': X['ders_id'],
            'konu_id': X['konu_id'],
            'altbaslik_id': X['altbaslik_id'],
            'zorluk': X['zorluk'],
            'user_id': user_id
        }
        
        total = user_data['total_questions']
        if total > 0:
            features['user_accuracy'] = user_data['correct_answers'] / total
        else:
            features['user_accuracy'] = 0.5
        
        subject_data = user_data['subject_performance'][X['ders_id']]
        if subject_data['total'] > 0:
            features['subject_accuracy'] = subject_data['correct'] / subject_data['total']
        else:
            features['subject_accuracy'] = 0.5
        
        topic_key = (X['ders_id'], X['konu_id'])
        topic_data = user_data['topic_performance'][topic_key]
        if topic_data['total'] > 0:
            features['topic_accuracy'] = topic_data['correct'] / topic_data['total']
        else:
            features['topic_accuracy'] = 0.5
        
        difficulty_data = user_data['difficulty_performance'][X['zorluk']]
        if difficulty_data['total'] > 0:
            features['difficulty_accuracy'] = difficulty_data['correct'] / difficulty_data['total']
        else:
            features['difficulty_accuracy'] = 0.5
        
        return features
    
    def predict(self, X):
        """Soru zorluğunu tahmin et"""
        try:
            user_id = X.get('user_id', 1)
            features = self.extract_features(X, user_id)
            
            # Kullanıcı verilerini kontrol et
            user_data = self.user_stats[user_id]
            
            # Model henüz eğitilmemişse varsayılan değer döndür
            if user_data['total_questions'] == 0:
                return 0.5
            
            # Gerçek performans verilerini kullan
            user_accuracy = user_data['correct_answers'] / user_data['total_questions']
            
            # Konu bazlı performans
            ders_id = X.get('ders_id', 1)
            konu_id = X.get('konu_id', 1)
            zorluk = X.get('zorluk', 3)
            
            # Ders bazlı performans
            subject_data = user_data['subject_performance'][ders_id]
            subject_accuracy = 0.5
            if subject_data['total'] > 0:
                subject_accuracy = subject_data['correct'] / subject_data['total']
            
            # Konu bazlı performans
            topic_key = (ders_id, konu_id)
            topic_data = user_data['topic_performance'][topic_key]
            topic_accuracy = 0.5
            if topic_data['total'] > 0:
                topic_accuracy = topic_data['correct'] / topic_data['total']
            
            # Zorluk bazlı performans
            difficulty_data = user_data['difficulty_performance'][zorluk]
            difficulty_accuracy = 0.5
            if difficulty_data['total'] > 0:
                difficulty_accuracy = difficulty_data['correct'] / difficulty_data['total']
            
            # Ağırlıklı performans hesaplama
            performance_score = (
                user_accuracy * 0.2 +
                subject_accuracy * 0.3 +
                topic_accuracy * 0.4 +
                difficulty_accuracy * 0.1
            )
            
            # Zorluk faktörü
            if zorluk <= 2:
                difficulty_factor = 0.2  # Kolay sorular için bonus
            elif zorluk <= 4:
                difficulty_factor = 0.0  # Orta sorular için nötr
            else:
                difficulty_factor = -0.2  # Zor sorular için ceza
            
            # Final skor hesaplama
            final_score = performance_score + difficulty_factor
            
            # 0-1 arasına sınırla
            final_score = max(0.0, min(1.0, final_score))
            
            return final_score
            
        except Exception as e:
            print(f"Enhanced ML Model prediction error: {e}")
            return self._get_fallback_prediction(X, user_id)
    
    def _get_fallback_prediction(self, X, user_id):
        """Fallback tahmin değeri hesapla"""
        user_data = self.user_stats[user_id]
        
        difficulty = X.get('zorluk', 3)
        user_accuracy = 0.5
        
        if user_data['total_questions'] > 0:
            user_accuracy = user_data['correct_answers'] / user_data['total_questions']
        
        if difficulty <= 2:
            base_score = 0.3
        elif difficulty <= 4:
            base_score = 0.5
        else:
            base_score = 0.7
        
        if user_accuracy < 0.4:
            score = base_score + 0.2
        elif user_accuracy > 0.7:
            score = base_score - 0.2
        else:
            score = base_score
        
        return max(0.0, min(1.0, score))
    
    def update(self, X, y):
        """Modeli güncelle"""
        try:
            user_id = X.get('user_id', 1)
            
            self.update_user_stats(user_id, X, y)
            
        except Exception as e:
            print(f"Model güncelleme hatası: {e}")
    
    def update_user_stats(self, user_id, X, y):
        """Kullanıcı istatistiklerini güncelle"""
        user_data = self.user_stats[user_id]
        
        user_data['total_questions'] += 1
        if y:
            user_data['correct_answers'] += 1
        
        subject_data = user_data['subject_performance'][X['ders_id']]
        subject_data['total'] += 1
        if y:
            subject_data['correct'] += 1
        
        topic_key = (X['ders_id'], X['konu_id'])
        topic_data = user_data['topic_performance'][topic_key]
        topic_data['total'] += 1
        if y:
            topic_data['correct'] += 1
        
        difficulty_data = user_data['difficulty_performance'][X['zorluk']]
        difficulty_data['total'] += 1
        if y:
            difficulty_data['correct'] += 1
        
        user_data['recent_performance'].append(y)
        if len(user_data['recent_performance']) > 10:
            user_data['recent_performance'].pop(0)
        
        user_data['learning_curve'].append({
            'timestamp': datetime.now(),
            'accuracy': user_data['correct_answers'] / user_data['total_questions']
        })
        
        user_data['last_activity'] = datetime.now()
        
        # Veri temizleme kontrolü
        self.cleanup_old_data(user_id)
        
        self.save_user_stats()
    
    def save_model(self):
        """Modeli kaydet"""
        try:
            with open(self.model_path, "wb") as f:
                pickle.dump(self.model, f)
        except Exception as e:
            print(f"Model kaydetme hatası: {e}")
    
    def get_recommendations(self, user_id, ders_id, num_questions=5):
        """Kullanıcı için soru önerileri"""
        user_data = self.user_stats[user_id]
        
        weak_topics = []
        for (topic_ders_id, topic_id), data in user_data['topic_performance'].items():
            if topic_ders_id == ders_id and data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy < 0.6:
                    weak_topics.append({
                        'topic_id': topic_id,
                        'accuracy': accuracy,
                        'priority': 1 - accuracy
                    })
        
        weak_topics.sort(key=lambda x: x['priority'], reverse=True)
        
        recommendations = []
        for topic in weak_topics[:num_questions]:
            recommendations.append({
                'topic_id': topic['topic_id'],
                'priority': topic['priority'],
                'current_accuracy': topic['accuracy'],
                'recommended_difficulty': 'medium' if topic['accuracy'] > 0.3 else 'easy'
            })
        
        return recommendations
    
    def get_user_insights(self, user_id):
        """Kullanıcı için içgörüler"""
        user_data = self.user_stats[user_id]
        
        if user_data['total_questions'] == 0:
            return {
                'message': 'Henüz soru çözülmemiş',
                'recommendations': ['İlk testinizi çözmeye başlayın!']
            }
        
        overall_accuracy = user_data['correct_answers'] / user_data['total_questions']
        
        best_subject = None
        best_accuracy = 0
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_subject = ders_id
        
        worst_subject = None
        worst_accuracy = 1
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy < worst_accuracy:
                    worst_accuracy = accuracy
                    worst_subject = ders_id
        
        recent_accuracy = 0
        if len(user_data['recent_performance']) > 0:
            recent_accuracy = sum(user_data['recent_performance']) / len(user_data['recent_performance'])
        
        insights = {
            'overall_accuracy': overall_accuracy,
            'total_questions': user_data['total_questions'],
            'best_subject': best_subject,
            'best_accuracy': best_accuracy,
            'worst_subject': worst_subject,
            'worst_accuracy': worst_accuracy,
            'recent_accuracy': recent_accuracy,
            'trend': 'improving' if recent_accuracy > overall_accuracy else 'declining' if recent_accuracy < overall_accuracy else 'stable'
        }
        
        return insights 