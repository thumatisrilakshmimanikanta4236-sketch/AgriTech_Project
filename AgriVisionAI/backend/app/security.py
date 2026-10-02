import hashlib, hmac, os, re, time, jwt
SECRET = os.getenv("SECRET_KEY", "dev-only-insecure-key")  # set SECRET_KEY in production
def hash_password(pw: str) -> str:
    salt = os.urandom(16); h = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt, 310_000)
    return salt.hex() + "$" + h.hex()
def verify_password(pw: str, stored: str) -> bool:
    salt, h = stored.split("$"); c = hashlib.pbkdf2_hmac("sha256", pw.encode(), bytes.fromhex(salt), 310_000)
    return hmac.compare_digest(c.hex(), h)
def password_ok(pw: str) -> bool:
    return bool(len(pw) >= 8 and re.search(r"[A-Z]", pw) and re.search(r"[a-z]", pw) and re.search(r"\d", pw) and re.search(r"[^\w\s]", pw))
def make_token(sub: str, kind="access", minutes=30) -> str:
    return jwt.encode({"sub": sub, "kind": kind, "exp": int(time.time()) + minutes*60}, SECRET, algorithm="HS256")
def read_token(tok: str, kind="access"):
    try:
        d = jwt.decode(tok, SECRET, algorithms=["HS256"]); return d["sub"] if d.get("kind") == kind else None
    except jwt.PyJWTError: return None
