import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        print("Logging in...")
        r = await client.post("http://localhost:8000/api/v1/auth/login", json={"email": "admin@complyarc.com", "password": "admin123"})
        if r.status_code != 200:
            print("Login failed:", r.status_code, r.text)
            return
        
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful! Access token obtained.")

        print("Triggering global watchlist sync...")
        r = await client.post("http://localhost:8000/api/v1/admin/ingest-sanctions", headers=headers)
        print("POST /admin/ingest-sanctions status:", r.status_code)
        print("Response:", r.json())

if __name__ == "__main__":
    asyncio.run(test())
