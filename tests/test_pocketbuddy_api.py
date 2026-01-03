"""
PocketBuddy API Tests - Slovak AI Assistant for Secondary Schools
Tests: Authentication, Admin, Flashcards, Quiz, Chat, Subjects, AI Sources
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learndash-slovak.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@pocketbuddy.sk"
ADMIN_PASSWORD = "admin123"

class TestHealthAndSeed:
    """Health check and seed data tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "PocketBuddy API"
        assert data["version"] == "1.0.0"
        print("✓ API root endpoint working")
    
    def test_seed_data(self):
        """Test seed data creation"""
        response = requests.post(f"{BASE_URL}/api/seed")
        assert response.status_code == 200
        data = response.json()
        # Either creates new data or says data exists
        assert "message" in data
        print(f"✓ Seed data: {data['message']}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_admin_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        assert data["user"]["is_approved"] == True
        assert data["user"]["is_active"] == True
        print(f"✓ Admin login successful: {data['user']['first_name']} {data['user']['last_name']}")
        return data["token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpass"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected correctly")
    
    def test_get_me_authenticated(self):
        """Test getting current user info"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get user info
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        print(f"✓ Get current user: {data['first_name']} {data['last_name']}")
    
    def test_get_me_unauthenticated(self):
        """Test getting user info without token"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("✓ Unauthenticated request rejected")


class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_statistics(self, admin_token):
        """Test admin statistics endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/statistics", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "students" in data
        assert "teachers" in data
        assert "pending_requests" in data
        assert "total_sources" in data
        assert "total_chats" in data
        print(f"✓ Statistics: {data['total_users']} users, {data['pending_requests']} pending requests")
    
    def test_get_all_users(self, admin_token):
        """Test getting all users"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} users")
    
    def test_get_registration_requests(self, admin_token):
        """Test getting pending registration requests"""
        response = requests.get(f"{BASE_URL}/api/admin/registration-requests", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} pending registration requests")


class TestSubjects:
    """Subject management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_subjects(self, admin_token):
        """Test getting all subjects"""
        response = requests.get(f"{BASE_URL}/api/subjects", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} subjects")
        if len(data) > 0:
            print(f"  Sample subjects: {[s['name'] for s in data[:5]]}")
        return data


class TestGrades:
    """Grade management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_grades(self, admin_token):
        """Test getting all grades"""
        response = requests.get(f"{BASE_URL}/api/grades", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} grades")
        if len(data) > 0:
            print(f"  Grades: {[g['name'] for g in data]}")


class TestAISources:
    """AI Sources management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_ai_sources(self, admin_token):
        """Test getting AI sources"""
        response = requests.get(f"{BASE_URL}/api/ai-sources", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} AI sources")


class TestFlashcards:
    """Flashcards generator tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_generate_flashcards(self, admin_token):
        """Test flashcard generation with AI"""
        response = requests.post(f"{BASE_URL}/api/flashcards/generate", 
            json={
                "topic": "Pytagorova veta",
                "count": 3
            },
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=60  # AI generation can take time
        )
        assert response.status_code == 200
        data = response.json()
        assert "flashcards" in data
        assert "topic" in data
        assert data["topic"] == "Pytagorova veta"
        assert isinstance(data["flashcards"], list)
        print(f"✓ Generated {len(data['flashcards'])} flashcards for topic: {data['topic']}")
        if len(data["flashcards"]) > 0:
            print(f"  Sample: {data['flashcards'][0]}")


class TestQuiz:
    """Quiz generator tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_generate_quiz(self, admin_token):
        """Test quiz generation with AI"""
        response = requests.post(f"{BASE_URL}/api/quiz/generate", 
            json={
                "topic": "Fotosyntéza",
                "question_count": 3
            },
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=60  # AI generation can take time
        )
        assert response.status_code == 200
        data = response.json()
        assert "questions" in data
        assert "topic" in data
        assert data["topic"] == "Fotosyntéza"
        assert isinstance(data["questions"], list)
        print(f"✓ Generated {len(data['questions'])} quiz questions for topic: {data['topic']}")
        if len(data["questions"]) > 0:
            print(f"  Sample question: {data['questions'][0].get('otazka', 'N/A')}")


class TestChat:
    """Chat functionality tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_chat(self, admin_token):
        """Test creating a new chat"""
        response = requests.post(f"{BASE_URL}/api/chats", 
            json={"title": "TEST_Testovacia konverzácia"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Testovacia konverzácia"
        print(f"✓ Created chat: {data['title']} (ID: {data['id']})")
        return data["id"]
    
    def test_get_chats(self, admin_token):
        """Test getting all chats"""
        response = requests.get(f"{BASE_URL}/api/chats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} chats")
    
    def test_send_message_and_get_ai_response(self, admin_token):
        """Test sending a message and getting AI response"""
        # First create a chat
        create_response = requests.post(f"{BASE_URL}/api/chats", 
            json={"title": "TEST_AI Chat Test"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        chat_id = create_response.json()["id"]
        
        # Send a message
        response = requests.post(f"{BASE_URL}/api/chats/{chat_id}/messages", 
            json={"content": "Ahoj, čo je Pytagorova veta?"},
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=60  # AI response can take time
        )
        assert response.status_code == 200
        data = response.json()
        assert "user_message" in data
        assert "ai_message" in data
        assert data["user_message"]["content"] == "Ahoj, čo je Pytagorova veta?"
        assert data["ai_message"]["sender_type"] == "ai"
        assert len(data["ai_message"]["content"]) > 0
        print(f"✓ Sent message and received AI response")
        print(f"  AI response preview: {data['ai_message']['content'][:100]}...")
    
    def test_get_chat_messages(self, admin_token):
        """Test getting messages from a chat"""
        # Get existing chats
        chats_response = requests.get(f"{BASE_URL}/api/chats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        chats = chats_response.json()
        
        if len(chats) > 0:
            chat_id = chats[0]["id"]
            response = requests.get(f"{BASE_URL}/api/chats/{chat_id}/messages", headers={
                "Authorization": f"Bearer {admin_token}"
            })
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✓ Got {len(data)} messages from chat")
        else:
            print("⚠ No chats available to test messages")


class TestTopics:
    """Topics endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_topics(self, admin_token):
        """Test getting available topics"""
        response = requests.get(f"{BASE_URL}/api/topics", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "topics" in data
        assert "subjects" in data
        print(f"✓ Got {len(data['topics'])} topics and {len(data['subjects'])} subjects")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
