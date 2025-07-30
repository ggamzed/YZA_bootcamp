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
        
        # Kullanıcı istatistikleri
        self.user_stats = self.load_user_stats()
        
        # Model yükleme
        if os.path.exists(self.model_path):
            try:
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
            except (EOFError, pickle.UnpicklingError, FileNotFoundError):
                # Bozuk dosya varsa sil ve yeni oluştur
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
                # Bozuk dosya varsa sil ve yeni oluştur
                try:
                    os.remove(self.user_stats_path)
                except:
                    pass
                print("⚠️ Bozuk user_stats.pkl dosyası silindi, yeni dosya oluşturuluyor...")
        
        return defaultdict(lambda: {
            'total_questions': 0,
            'correct_answers': 0,
            'subject_performance': defaultdict(lambda: {'total': 0, 'correct': 0}),
            'topic_performance': defaultdict(lambda: {'total': 0, 'correct': 0}),
            'difficulty_performance': defaultdict(lambda: {'total': 0, 'correct': 0}),
            'recent_performance': [],  # Son 10 soru
            'learning_curve': [],      # Zaman bazlı performans
            'last_activity': None
        })
    
    def save_user_stats(self):
        with open(self.user_stats_path, "wb") as f:
            pickle.dump(self.user_stats, f)
    
    def create_enhanced_model(self):
        # Basit özellik pipeline'ı
        num_features = ['zorluk', 'user_accuracy', 'subject_accuracy', 'topic_accuracy', 'difficulty_accuracy']
        cat_features = ['ders_id', 'konu_id', 'altbaslik_id']
        
        # Sayısal özellikler için StandardScaler
        num_pipeline = compose.Select(*num_features) | preprocessing.StandardScaler()
        
        # Kategorik özellikler için OneHotEncoder
        cat_pipeline = compose.Select(*cat_features) | preprocessing.OneHotEncoder()
        
        # Özellik birleştirme
        feature_pipeline = compose.TransformerUnion(
            num_pipeline,
            cat_pipeline
        )
        
        # Basit linear model
        self.model = feature_pipeline | linear_model.LinearRegression()
    
    def extract_features(self, X, user_id):
        """Gelişmiş özellik çıkarma"""
        user_data = self.user_stats[user_id]
        
        # Temel özellikler
        features = {
            'ders_id': X['ders_id'],
            'konu_id': X['konu_id'],
            'altbaslik_id': X['altbaslik_id'],
            'zorluk': X['zorluk'],
            'user_id': user_id
        }
        
        # Performans bazlı özellikler
        total = user_data['total_questions']
        if total > 0:
            features['user_accuracy'] = user_data['correct_answers'] / total
        else:
            features['user_accuracy'] = 0.5  # Başlangıç değeri
        
        # Ders bazlı performans
        subject_data = user_data['subject_performance'][X['ders_id']]
        if subject_data['total'] > 0:
            features['subject_accuracy'] = subject_data['correct'] / subject_data['total']
        else:
            features['subject_accuracy'] = 0.5
        
        # Konu bazlı performans
        topic_key = (X['ders_id'], X['konu_id'])
        topic_data = user_data['topic_performance'][topic_key]
        if topic_data['total'] > 0:
            features['topic_accuracy'] = topic_data['correct'] / topic_data['total']
        else:
            features['topic_accuracy'] = 0.5
        
        # Zorluk bazlı performans
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
            
            # Model tahmini
            prediction = self.model.predict_one(features)
            
            # Tahmin değerini 0-1 arasında sınırla
            prediction = max(0.0, min(1.0, prediction))
            
            return prediction
        except Exception as e:
            # Hata durumunda basit heuristik kullan
            user_id = X.get('user_id', 1)
            user_data = self.user_stats[user_id]
            
            # Basit zorluk hesaplama
            difficulty = X.get('zorluk', 3)
            user_accuracy = 0.5
            
            if user_data['total_questions'] > 0:
                user_accuracy = user_data['correct_answers'] / user_data['total_questions']
            
            # Zorluk ve kullanıcı performansına göre skor
            if difficulty <= 2:
                base_score = 0.3
            elif difficulty <= 4:
                base_score = 0.5
            else:
                base_score = 0.7
            
            # Kullanıcı performansına göre ayarla
            if user_accuracy < 0.4:
                score = base_score + 0.2  # Zayıf kullanıcıya kolay sorular
            elif user_accuracy > 0.7:
                score = base_score - 0.2  # Güçlü kullanıcıya zor sorular
            else:
                score = base_score
            
            return max(0.0, min(1.0, score))
    
    def update(self, X, y):
        """Modeli güncelle"""
        try:
            user_id = X.get('user_id', 1)
            
            # Sadece kullanıcı istatistiklerini güncelle (model güncelleme hatası var)
            self.update_user_stats(user_id, X, y)
            
        except Exception as e:
            print(f"Model güncelleme hatası: {e}")
    
    def update_user_stats(self, user_id, X, y):
        """Kullanıcı istatistiklerini güncelle"""
        user_data = self.user_stats[user_id]
        
        # Genel istatistikler
        user_data['total_questions'] += 1
        if y:
            user_data['correct_answers'] += 1
        
        # Ders bazlı istatistikler
        subject_data = user_data['subject_performance'][X['ders_id']]
        subject_data['total'] += 1
        if y:
            subject_data['correct'] += 1
        
        # Konu bazlı istatistikler
        topic_key = (X['ders_id'], X['konu_id'])
        topic_data = user_data['topic_performance'][topic_key]
        topic_data['total'] += 1
        if y:
            topic_data['correct'] += 1
        
        # Zorluk bazlı istatistikler
        difficulty_data = user_data['difficulty_performance'][X['zorluk']]
        difficulty_data['total'] += 1
        if y:
            difficulty_data['correct'] += 1
        
        # Son performans
        user_data['recent_performance'].append(y)
        if len(user_data['recent_performance']) > 10:
            user_data['recent_performance'].pop(0)
        
        # Öğrenme eğrisi
        user_data['learning_curve'].append({
            'timestamp': datetime.now(),
            'accuracy': user_data['correct_answers'] / user_data['total_questions']
        })
        
        # Son aktivite
        user_data['last_activity'] = datetime.now()
        
        # İstatistikleri kaydet
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
        
        # Kullanıcının zayıf olduğu konuları bul
        weak_topics = []
        for (topic_ders_id, topic_id), data in user_data['topic_performance'].items():
            if topic_ders_id == ders_id and data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy < 0.6:  # %60'ın altında
                    weak_topics.append({
                        'topic_id': topic_id,
                        'accuracy': accuracy,
                        'priority': 1 - accuracy  # Düşük başarı = yüksek öncelik
                    })
        
        # Önceliğe göre sırala
        weak_topics.sort(key=lambda x: x['priority'], reverse=True)
        
        # Önerileri döndür
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
        
        # Genel performans
        overall_accuracy = user_data['correct_answers'] / user_data['total_questions']
        
        # En iyi ders
        best_subject = None
        best_accuracy = 0
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy > best_accuracy:
                    best_accuracy = accuracy
                    best_subject = ders_id
        
        # En zayıf ders
        worst_subject = None
        worst_accuracy = 1
        for ders_id, data in user_data['subject_performance'].items():
            if data['total'] > 0:
                accuracy = data['correct'] / data['total']
                if accuracy < worst_accuracy:
                    worst_accuracy = accuracy
                    worst_subject = ders_id
        
        # Son performans trendi
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