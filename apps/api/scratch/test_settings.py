import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Login
        r = await client.post("http://localhost:8000/api/v1/auth/login", data={"username": "admin@complyarc.com", "password": "admin123"})
        if r.status_code != 200:
            print("Login failed", r.text)
            return
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Get settings
        r = await client.get("http://localhost:8000/api/v1/settings", headers=headers)
        print("GET /settings:", r.status_code, r.text)

        # Update setting
        r = await client.put("http://localhost:8000/api/v1/settings/news_api_key", json={"value": "test-key-123"}, headers=headers)
        print("PUT /settings:", r.status_code, r.text)

        # Get settings again
        r = await client.get("http://localhost:8000/api/v1/settings", headers=headers)
        print("GET /settings again:", r.status_code, r.text)

asyncio.run(test())
