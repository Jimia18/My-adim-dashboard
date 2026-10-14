import os
from datetime import timedelta
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, get_jwt_identity,
    jwt_required
)
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

load_dotenv()
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-change-me")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///portfolio.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

allowed_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
CORS(app, resources={r"/api/*": {"origins": allowed_origin}})
db = SQLAlchemy(app)
jwt = JWTManager(app)



class Admin(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(180), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)


class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    tech_stack = db.Column(db.String(500), nullable=False, default="")
    image_url = db.Column(db.String(1000), nullable=False, default="")
    project_url = db.Column(db.String(1000), nullable=False, default="")
    github_url = db.Column(db.String(1000), nullable=False, default="")
    featured = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def as_dict(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "tech_stack": self.tech_stack, "image_url": self.image_url,
            "project_url": self.project_url, "github_url": self.github_url,
            "featured": self.featured,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False, default="General")
    level = db.Column(db.Integer, nullable=False, default=70)

    def as_dict(self):
        return {"id": self.id, "name": self.name, "category": self.category, "level": self.level}


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), nullable=False)
    subject = db.Column(db.String(180), nullable=False, default="")
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def as_dict(self):
        return {
            "id": self.id, "name": self.name, "email": self.email,
            "subject": self.subject, "message": self.message, "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(180), nullable=False, default="Your Name")
    title = db.Column(db.String(180), nullable=False, default="Software Developer")
    bio = db.Column(db.Text, nullable=False, default="")
    email = db.Column(db.String(180), nullable=False, default="")
    location = db.Column(db.String(180), nullable=False, default="")
    avatar_url = db.Column(db.String(1000), nullable=False, default="")
    github_url = db.Column(db.String(1000), nullable=False, default="")
    linkedin_url = db.Column(db.String(1000), nullable=False, default="")

    def as_dict(self):
        return {key: getattr(self, key) for key in (
            "full_name", "title", "bio", "email", "location",
            "avatar_url", "github_url", "linkedin_url"
        )}


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if not isinstance(identity, str) or not identity.startswith("admin:"):
            return jsonify({"error": "Administrator access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def payload():
    return request.get_json(silent=True) or {}


def clean_text(data, key, default=""):
    value = data.get(key, default)
    return str(value).strip() if value is not None else default


def init_db():
    with app.app_context():
        db.create_all()
        if not Admin.query.first():
            email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
            password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
            db.session.add(Admin(email=email, password_hash=generate_password_hash(password)))
        if not Profile.query.first():
            db.session.add(Profile(full_name="Your Name", title="Software Developer",
                                   bio="I build useful and accessible digital experiences.",
                                   email="", location=""))
        if not Skill.query.first():
            for name, category, level in [
                ("HTML & CSS", "Frontend", 85), ("JavaScript", "Frontend", 75),
                ("React", "Frontend", 70), ("Python", "Backend", 75),
                ("SQL", "Database", 70), ("Java", "Programming", 65)
            ]:
                db.session.add(Skill(name=name, category=category, level=level))
        db.session.commit()

@app.route("/", methods=["GET"])
def home():
    return {
        "message": "Portfolio Admin API is running",
        "status": "success"
    }, 200


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/auth/login")
def login():
    data = payload()
    email = clean_text(data, "email").lower()
    password = data.get("password", "")
    admin = Admin.query.filter_by(email=email).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401
    token = create_access_token(identity=f"admin:{admin.id}")
    return jsonify({"access_token": token, "admin": {"id": admin.id, "email": admin.email}})


@app.get("/api/auth/me")
@admin_required
def me():
    identity = get_jwt_identity()
    admin_id = int(identity.split(":", 1)[1])
    admin = db.session.get(Admin, admin_id)
    if not admin:
        return jsonify({"error": "Admin not found"}), 404
    return jsonify({"id": admin.id, "email": admin.email})


@app.get("/api/projects")
def list_projects():
    projects = Project.query.order_by(Project.id.desc()).all()
    return jsonify([p.as_dict() for p in projects])


@app.post("/api/projects")
@admin_required
def create_project():
    data = payload()
    title = clean_text(data, "title")
    if not title:
        return jsonify({"error": "Project title is required"}), 400
    item = Project(
        title=title, description=clean_text(data, "description"),
        tech_stack=clean_text(data, "tech_stack"), image_url=clean_text(data, "image_url"),
        project_url=clean_text(data, "project_url"), github_url=clean_text(data, "github_url"),
        featured=bool(data.get("featured", False))
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.as_dict()), 201


@app.put("/api/projects/<int:item_id>")
@admin_required
def update_project(item_id):
    item = db.session.get(Project, item_id)
    if not item:
        return jsonify({"error": "Project not found"}), 404
    data = payload()
    for key in ("title", "description", "tech_stack", "image_url", "project_url", "github_url"):
        if key in data:
            setattr(item, key, clean_text(data, key))
    if not item.title:
        return jsonify({"error": "Project title is required"}), 400
    if "featured" in data:
        item.featured = bool(data["featured"])
    db.session.commit()
    return jsonify(item.as_dict())


@app.delete("/api/projects/<int:item_id>")
@admin_required
def delete_project(item_id):
    item = db.session.get(Project, item_id)
    if not item:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Project deleted"})


@app.get("/api/skills")
def list_skills():
    return jsonify([s.as_dict() for s in Skill.query.order_by(Skill.category, Skill.name).all()])


@app.post("/api/skills")
@admin_required
def create_skill():
    data = payload()
    name = clean_text(data, "name")
    if not name:
        return jsonify({"error": "Skill name is required"}), 400
    try:
        level = max(0, min(100, int(data.get("level", 70))))
    except (TypeError, ValueError):
        return jsonify({"error": "Level must be a number from 0 to 100"}), 400
    skill = Skill(name=name, category=clean_text(data, "category", "General") or "General", level=level)
    db.session.add(skill)
    db.session.commit()
    return jsonify(skill.as_dict()), 201


@app.put("/api/skills/<int:item_id>")
@admin_required
def update_skill(item_id):
    skill = db.session.get(Skill, item_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    data = payload()
    if "name" in data:
        skill.name = clean_text(data, "name")
    if "category" in data:
        skill.category = clean_text(data, "category", "General") or "General"
    if "level" in data:
        try:
            skill.level = max(0, min(100, int(data["level"])))
        except (TypeError, ValueError):
            return jsonify({"error": "Level must be a number from 0 to 100"}), 400
    if not skill.name:
        return jsonify({"error": "Skill name is required"}), 400
    db.session.commit()
    return jsonify(skill.as_dict())


@app.delete("/api/skills/<int:item_id>")
@admin_required
def delete_skill(item_id):
    skill = db.session.get(Skill, item_id)
    if not skill:
        return jsonify({"error": "Skill not found"}), 404
    db.session.delete(skill)
    db.session.commit()
    return jsonify({"message": "Skill deleted"})


@app.post("/api/messages")
def create_message():
    data = payload()
    name, email, message = clean_text(data, "name"), clean_text(data, "email"), clean_text(data, "message")
    if not name or not email or not message:
        return jsonify({"error": "Name, email, and message are required"}), 400
    if len(name) > 120 or len(email) > 180 or len(message) > 10000:
        return jsonify({"error": "One or more fields are too long"}), 400
    item = Message(name=name, email=email, subject=clean_text(data, "subject"), message=message)
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Message sent"}), 201


@app.get("/api/messages")
@admin_required
def list_messages():
    return jsonify([m.as_dict() for m in Message.query.order_by(Message.id.desc()).all()])


@app.put("/api/messages/<int:item_id>")
@admin_required
def update_message(item_id):
    item = db.session.get(Message, item_id)
    if not item:
        return jsonify({"error": "Message not found"}), 404
    data = payload()
    if "is_read" in data:
        item.is_read = bool(data["is_read"])
    db.session.commit()
    return jsonify(item.as_dict())


@app.delete("/api/messages/<int:item_id>")
@admin_required
def delete_message(item_id):
    item = db.session.get(Message, item_id)
    if not item:
        return jsonify({"error": "Message not found"}), 404
    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Message deleted"})


@app.get("/api/profile")
def get_profile():
    profile = Profile.query.first()
    return jsonify(profile.as_dict())


@app.put("/api/profile")
@admin_required
def update_profile():
    profile = Profile.query.first()
    if not profile:
        profile = Profile()
        db.session.add(profile)
    data = payload()
    for key in ("full_name", "title", "bio", "email", "location", "avatar_url", "github_url", "linkedin_url"):
        if key in data:
            setattr(profile, key, clean_text(data, key))
    if not profile.full_name or not profile.title:
        return jsonify({"error": "Name and title are required"}), 400
    db.session.commit()
    return jsonify(profile.as_dict())


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Endpoint not found"}), 404


init_db()

if __name__ == "__main__":
    app.run(debug=True)
