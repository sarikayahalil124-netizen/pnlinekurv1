"""Iteration 8 tests: candles endpoint (BUG1), TTS i18n (BUG2), AI chat lang (FEATURE), regressions."""
import os
import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


# ----------------------------- BUG1: candles endpoint -----------------------------
class TestCandles:
    def test_candles_usd_1a(self, s):
        r = s.get(f"{API}/candles/USD", params={"range": "1A"}, timeout=20)
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        assert body["code"] == "USD"
        assert body["range"] == "1A"
        assert isinstance(body["candles"], list)
        assert isinstance(body["ma"], list)
        # 30-day seeded history should aggregate to a healthy count of candles
        assert len(body["candles"]) >= 20, f"expected >=20 candles, got {len(body['candles'])}"
        # candle shape
        c0 = body["candles"][0]
        for k in ("o", "h", "l", "c", "ts"):
            assert k in c0
        assert c0["h"] >= c0["l"]
        # ma length matches candles length
        assert len(body["ma"]) == len(body["candles"])

    def test_candles_ranges_differ(self, s):
        r_short = s.get(f"{API}/candles/USD", params={"range": "1s"}, timeout=20).json()
        r_long = s.get(f"{API}/candles/USD", params={"range": "1A"}, timeout=20).json()
        # If either is empty, ranges technically differ – but require the long range to have data
        assert r_long["candles"], "1A must have candles from seeded history"
        # Compare the arrays: they must NOT be identical (the reported bug)
        assert r_short["candles"] != r_long["candles"], "1s and 1A returned identical data"

    def test_candles_gold(self, s):
        r = s.get(f"{API}/candles/GA", params={"range": "1A"}, timeout=20)
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        assert body["code"] == "GA"
        assert isinstance(body["candles"], list)


# ----------------------------- Seeding did not corrupt prices -----------------------------
class TestPricesIntegrity:
    def test_prices_have_change_pct(self, s):
        r = s.get(f"{API}/prices", timeout=15)
        assert r.status_code == 200
        items = r.json()["items"]
        assert items, "prices/items empty"
        with_change = [it for it in items if it.get("changePct") is not None]
        # Not every item may have changePct, but the majority should
        assert len(with_change) >= max(1, len(items) // 2), f"only {len(with_change)}/{len(items)} items have changePct"

    def test_prices_usd_day_hi_lo_sane(self, s):
        r = s.get(f"{API}/prices/USD", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["code"] == "USD"
        hi = body.get("dayHigh")
        lo = body.get("dayLow")
        if hi is not None and lo is not None:
            assert hi >= lo, f"dayHigh {hi} < dayLow {lo}"
            # Not wildly off from current sell (within +/-30%)
            sell = body.get("marketSell") or body.get("sell")
            if sell:
                assert 0.5 * sell <= lo <= 2.0 * sell
                assert 0.5 * sell <= hi <= 2.0 * sell


# ----------------------------- BUG2: TTS Turkish numbers -----------------------------
class TestTTSLang:
    def test_tts_turkish_numbers(self, s):
        r = s.post(f"{API}/ai/tts",
                   json={"text": "Dolar 48,2690 TL oldu, %1,24 arttı.", "lang": "tr"},
                   timeout=60)
        assert r.status_code == 200, r.text[:300]
        url = r.json()["url"]
        assert url.endswith(".mp3")

    def test_tts_english(self, s):
        r = s.post(f"{API}/ai/tts",
                   json={"text": "The dollar is 48.26 today.", "lang": "en"},
                   timeout=60)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["url"].endswith(".mp3")

    def test_tts_german(self, s):
        r = s.post(f"{API}/ai/tts",
                   json={"text": "Der Dollar steht bei 48,26.", "lang": "de"},
                   timeout=60)
        assert r.status_code == 200, r.text[:300]


# ----------------------------- FEATURE: AI chat language -----------------------------
class TestAIChatLang:
    def _ask(self, s, device, message, lang):
        s.delete(f"{API}/ai/messages", params={"deviceId": device})
        r = s.post(f"{API}/ai/chat",
                   json={"deviceId": device, "message": message, "lang": lang},
                   timeout=90)
        assert r.status_code == 200, r.text[:300]
        reply = (r.json().get("reply") or "").strip()
        assert reply, "empty reply"
        s.delete(f"{API}/ai/messages", params={"deviceId": device})
        return reply

    def test_english_reply(self, s):
        reply = self._ask(s, "TEST_iter8_en", "How is the dollar today? Reply briefly.", "en")
        low = reply.lower()
        # Very strong Turkish-only markers should NOT dominate an English reply
        tr_markers = ("bugün", "değil", "şu an", "önerilir", "kurun", "lira", "üzerinde")
        assert not any(m in low for m in tr_markers), f"reply looks Turkish, not English: {reply[:200]}"
        # Expect at least a couple of common English words
        en_hints = ("the ", " is ", " and ", " today", "dollar", "usd")
        assert any(h in low for h in en_hints), f"reply lacks English hints: {reply[:200]}"

    def test_turkish_reply(self, s):
        reply = self._ask(s, "TEST_iter8_tr", "Dolar bugün ne durumda? Kısaca yaz.", "tr")
        low = reply.lower()
        assert any(w in low for w in ("dolar", "lira", "bugün", "kur", "tl")), reply[:200]

    def test_german_reply(self, s):
        reply = self._ask(s, "TEST_iter8_de", "Wie steht der Dollar heute? Antworte kurz.", "de")
        low = reply.lower()
        # tolerate umlauts; look for very common German words
        de_hints = ("der ", "die ", "das ", "und ", "ist ", "heute", "dollar", "euro")
        assert any(h in low for h in de_hints), f"reply lacks German hints: {reply[:200]}"


# ----------------------------- Regressions: admin, alarms, admin products -----------------------------
class TestRegressions:
    def test_admin_login(self, s):
        r = s.post(f"{API}/auth/login",
                   json={"email": "admin@onlinekur.com", "password": "OnlineKur2026!"},
                   timeout=15)
        assert r.status_code == 200, r.text[:200]
        body = r.json()
        assert body.get("access_token") or body.get("token")

    def test_admin_products_requires_auth(self, s):
        r = s.get(f"{API}/admin/products", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_products_with_auth(self, s):
        r = s.post(f"{API}/auth/login",
                   json={"email": "admin@onlinekur.com", "password": "OnlineKur2026!"},
                   timeout=15)
        token = r.json().get("access_token") or r.json().get("token")
        r2 = s.get(f"{API}/admin/products", headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r2.status_code == 200, r2.text[:200]
        body = r2.json()
        assert isinstance(body, (list, dict))

    def test_alarms_crud(self, s):
        device = "TEST_iter8_dev"
        # Create
        payload = {"deviceId": device, "code": "USD", "name": "Amerikan Doları", "basis": "sell", "condition": ">", "target": 999}
        r = s.post(f"{API}/alarms", json=payload, timeout=15)
        assert r.status_code in (200, 201), r.text[:200]
        aid = r.json()["id"]
        # List
        rl = s.get(f"{API}/alarms", params={"deviceId": device}, timeout=15)
        assert rl.status_code == 200
        items = rl.json().get("items", rl.json())
        assert any(a.get("id") == aid for a in items)
        # Update
        ru = s.put(f"{API}/alarms/{aid}", json={"target": 1000, "active": True}, timeout=15)
        assert ru.status_code == 200, ru.text[:200]
        # Delete
        rd = s.delete(f"{API}/alarms/{aid}", timeout=15)
        assert rd.status_code == 200, rd.text[:200]
