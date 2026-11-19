import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)


def test_suite():
    print("=== MULAI PENGUJIAN ENDPOINT NUSAJALUR ===")

    # 1. GET /api/v1/health
    res = client.get("/api/v1/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    assert res.json() == {"status": "ok"}, f"Health response invalid: {res.json()}"
    print("[PASS] 1. GET /api/v1/health -> 200 OK {'status': 'ok'}")

    # 2. POST /api/v1/auth/login (Demo account)
    res = client.post("/api/v1/auth/login", json={"email": "demo@nusajalur.id", "password": "demo1234"})
    assert res.status_code == 200, f"Login failed: {res.text}"
    data = res.json()
    assert "access_token" in data
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 2. POST /api/v1/auth/login -> 200 OK (JWT Bearer Token issued)")

    # 3. GET /api/v1/trails (JWT required)
    res = client.get("/api/v1/trails", headers=headers)
    assert res.status_code == 200
    trails_data = res.json()
    assert trails_data["total"] >= 6
    print(f"[PASS] 3. GET /api/v1/trails -> 200 OK (Total {trails_data['total']} trails retrieved)")

    # 3b. GET /api/v1/trails with filter & lat/lon
    res = client.get("/api/v1/trails?theme=heritage&lat=-6.921132&lon=107.609653", headers=headers)
    assert res.status_code == 200
    filtered_trails = res.json()
    first_trail = filtered_trails["trails"][0]
    assert first_trail["distance_from_user_km"] is not None
    print(f"[PASS] 3b. GET /api/v1/trails (filter & Haversine) -> nearest trail distance: {first_trail['distance_from_user_km']} km")

    # 4. GET /api/v1/trails/{trail_id}
    trail_id = "trail-braga-heritage"
    res = client.get(f"/api/v1/trails/{trail_id}", headers=headers)
    assert res.status_code == 200
    trail_detail = res.json()
    assert len(trail_detail["waypoints"]) == 4
    print(f"[PASS] 4. GET /api/v1/trails/{trail_id} -> 200 OK ({len(trail_detail['waypoints'])} waypoints)")

    # 5. GET /api/v1/trails/{trail_id}/pricing
    res = client.get(f"/api/v1/trails/{trail_id}/pricing?visit_time=07:00", headers=headers)
    assert res.status_code == 200
    pricing = res.json()
    assert pricing["is_off_peak"] is True
    assert pricing["discount_percentage"] == 20
    print(f"[PASS] 5. GET /api/v1/trails/{trail_id}/pricing -> 200 OK (Off-peak: {pricing['final_price_idr']} IDR, 20% discount applied)")

    # 6. POST /api/v1/passes (Buy Digital Pass)
    res = client.post(
        "/api/v1/passes",
        headers=headers,
        json={"trail_id": trail_id, "visit_time": "07:30"},
    )
    assert res.status_code == 201
    pass_data = res.json()
    pass_id = pass_data["id"]
    alloc = pass_data["allocation"]
    assert alloc["umkm_allocation_idr"] > 0
    assert alloc["curator_allocation_idr"] > 0
    assert alloc["platform_fee_idr"] > 0
    print(f"[PASS] 6. POST /api/v1/passes -> 201 Created (Pass ID: {pass_id}, Split: UMKM {alloc['umkm_allocation_idr']} IDR, Curator {alloc['curator_allocation_idr']} IDR, Platform {alloc['platform_fee_idr']} IDR)")

    # 7a. POST /api/v1/passes/{pass_id}/checkins (Out-of-range error test)
    # Coordinate far away in Jakarta (-6.2088, 106.8456)
    res = client.post(
        f"/api/v1/passes/{pass_id}/checkins",
        headers=headers,
        json={"waypoint_id": "wp-braga-01", "user_lat": -6.2088, "user_lon": 106.8456},
    )
    assert res.status_code == 400
    err = res.json()
    assert "error" in err
    assert err["error"]["code"] == "CHECKIN_OUT_OF_RANGE"
    print(f"[PASS] 7a. Checkin Out-of-Range -> 400 Bad Request ({err['error']['code']}: {err['error']['message']})")

    # 7b. POST /api/v1/passes/{pass_id}/checkins (Valid GPS within 50m of Gedung Merdeka)
    res = client.post(
        f"/api/v1/passes/{pass_id}/checkins",
        headers=headers,
        json={"waypoint_id": "wp-braga-01", "user_lat": -6.921130, "user_lon": 107.609650},
    )
    assert res.status_code == 200
    checkin_data = res.json()
    assert checkin_data["is_valid"] is True
    assert checkin_data["story_text"] != ""
    assert checkin_data["voucher_code"] == "ROTIHERITAGE10"
    print(f"[PASS] 7b. Checkin Valid GPS -> 200 OK (Story & Voucher '{checkin_data['voucher_code']}' unlocked)")

    # 8. GET /api/v1/users/me/trips
    res = client.get("/api/v1/users/me/trips", headers=headers)
    assert res.status_code == 200
    trips_data = res.json()
    assert trips_data["total_passes_purchased"] >= 1
    assert trips_data["total_steps_achieved"] > 0
    print(f"[PASS] 8. GET /api/v1/users/me/trips -> 200 OK ({trips_data['total_passes_purchased']} passes, {trips_data['total_steps_achieved']} steps, {trips_data['total_kcal_burned']} kcal)")

    # 9. GET /api/v1/public/destinations-nearby (X-API-Key)
    b2b_key = "nj_live_matchabaobei_tst2026_secret_key"
    res = client.get(
        "/api/v1/public/destinations-nearby?lat=-6.9211&lon=107.6096&radius_m=1000",
        headers={"X-API-Key": b2b_key},
    )
    assert res.status_code == 200
    nearby = res.json()
    assert nearby["total_found"] > 0
    print(f"[PASS] 9. GET /api/v1/public/destinations-nearby -> 200 OK ({nearby['total_found']} nearby points found)")

    # 10. GET /api/v1/public/measured-trails (X-API-Key)
    res = client.get(
        "/api/v1/public/measured-trails?min_kcal=150&max_kcal=350",
        headers={"X-API-Key": b2b_key},
    )
    assert res.status_code == 200
    measured = res.json()
    assert measured["total_trails"] > 0
    print(f"[PASS] 10. GET /api/v1/public/measured-trails -> 200 OK ({measured['total_trails']} measured trails)")

    # 11. Error handling format tests (401, 403, 404, 422)
    # Test 401: No token
    res = client.get("/api/v1/trails")
    assert res.status_code == 401
    assert "error" in res.json() and res.json()["error"]["code"] == "MISSING_TOKEN"

    # Test 403: Bad API key
    res = client.get("/api/v1/public/destinations-nearby?lat=-6.9&lon=107.6", headers={"X-API-Key": "wrong_key"})
    assert res.status_code == 403
    assert "error" in res.json() and res.json()["error"]["code"] == "INVALID_API_KEY"

    # Test 404: Not found
    res = client.get("/api/v1/trails/trail-tidak-ada", headers=headers)
    assert res.status_code == 404
    assert "error" in res.json() and res.json()["error"]["code"] == "TRAIL_NOT_FOUND"

    # Test 422: Validation error
    res = client.post("/api/v1/auth/register", json={"email": "invalid-email", "password": "123"})
    assert res.status_code == 422
    assert "error" in res.json() and res.json()["error"]["code"] == "VALIDATION_ERROR"

    print("[PASS] 11. Error Responses (400, 401, 403, 404, 422) all adhere to {'error': {'code': '...', 'message': '...'}}")
    print("\n=== SEMUA TEST BERHASIL 100%! ===")


if __name__ == "__main__":
    test_suite()
