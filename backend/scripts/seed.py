import os
import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import hash_password, hash_api_key
from app.domain.models import User, Curator, Trail, Waypoint, ApiKey
from app.infrastructure.database import Base, engine, SessionLocal


def seed_database():
    print("Memulai inisialisasi schema database...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # 1. Seed Demo User
        demo_email = "demo@nusajalur.id"
        existing_user = db.query(User).filter(User.email == demo_email).first()
        if not existing_user:
            demo_user = User(
                id="usr-demo-nusajalur-2026",
                email=demo_email,
                hashed_password=hash_password("demo1234"),
                full_name="Penjelajah Bandung (Demo Akun)",
            )
            db.add(demo_user)
            print(f"Akun demo dibuat: {demo_email} / demo1234")
        else:
            print(f"Akun demo sudah ada: {demo_email}")

        # 2. Seed Default Test B2B API Key (for Group Belva / Health & Wellbeing)
        default_key = settings.DEFAULT_API_KEY
        hashed_key = hash_api_key(default_key)
        existing_key = db.query(ApiKey).filter(ApiKey.key_hash == hashed_key).first()
        if not existing_key:
            test_api_key = ApiKey(
                id="key-belva-tst-2026",
                key_hash=hashed_key,
                name="Belva Health & Wellbeing B2B Key",
                owner_group="Kelompok Belva (Health & Wellbeing)",
                is_active=True,
            )
            db.add(test_api_key)
            print(f"B2B Test API Key dibuat: {default_key}")
        else:
            print("B2B Test API Key sudah terdaftar.")

        # 3. Seed Local Curators
        curators_data = [
            {
                "id": "cur-ridwan-heritage",
                "name": "Kang Ridwan Budaya",
                "bio": "Sejarawan lokal dan pegiat pelestarian cagar budaya Bandung Heritage Society.",
                "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "badge": "Kurator Utama Bandung Heritage",
            },
            {
                "id": "cur-annisa-fitness",
                "name": "Teh Annisa Jelajah",
                "bio": "Instruktur kebugaran jalan kaki dan penggagas Bandung Walking Club.",
                "avatar_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
                "badge": "Pemandu Kebugaran Jalan Santai",
            },
            {
                "id": "cur-abah-kuliner",
                "name": "Abah Dadang Priangan",
                "bio": "Kurator kuliner tradisional Sunda dan penikmat jajanan legendaris kota kembang.",
                "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
                "badge": "Pakar Kuliner Legendaris",
            },
            {
                "id": "cur-bambang-jakarta",
                "name": "Bang Bambang Batavia",
                "bio": "Peneliti sejarah maritim Sunda Kelapa dan cagar budaya Kota Tua Jakarta.",
                "avatar_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
                "badge": "Kurator Batavia Heritage Walk",
            },
            {
                "id": "cur-mpok-siti-betawi",
                "name": "Mpok Siti Harmoni",
                "bio": "Penggiat pelestarian seni budaya Betawi dan kuliner otentik perkampungan Jakarta.",
                "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
                "badge": "Pustakawan Budaya Betawi",
            },
        ]

        for c_data in curators_data:
            c = db.query(Curator).filter(Curator.id == c_data["id"]).first()
            if not c:
                c = Curator(**c_data)
                db.add(c)
        db.commit()
        print("Kurator lokal berhasil diisi.")

        # 4. Seed 6 Measured Cultural Walking Trails in Bandung
        trails_data = [
            # Trail 1: Braga Heritage
            {
                "trail": {
                    "id": "trail-braga-heritage",
                    "title": "Jelajah Kolonial & Art Deco Braga - Asia Afrika",
                    "slug": "braga-heritage-art-deco",
                    "theme": "heritage",
                    "description": "Menelusuri koridor megah bangunan Art Deco warisan era kolonial di sepanjang Jalan Braga hingga Titik Nol Kilometer Bandung.",
                    "city": "Bandung",
                    "distance_km": 2.4,
                    "est_duration_min": 45,
                    "est_steps": 3200,
                    "est_kcal": 160,
                    "price_idr": 25000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-ridwan-heritage",
                },
                "waypoints": [
                    {
                        "id": "wp-braga-01",
                        "sequence": 1,
                        "name": "Gedung Merdeka & Museum KAA",
                        "category": "heritage",
                        "description": "Gedung bersejarah bekas Societeit Concordia dan tempat KTT Asia Afrika 1955.",
                        "lat": -6.921132,
                        "lon": 107.609653,
                        "radius_m": 50,
                        "story_text": "Di gedung megah inilah pada April 1955, para pemimpin dari 29 negara Asia dan Afrika bersatu mengikrarkan Dasa Sila Bandung. Arsitektur neo-klasik berpadu art-deco ini dirancang oleh arsitek terkemuka Van Galen Last dan C.P. Wolff Schoemaker.",
                        "umkm_name": "Toko Roti Sumber Hidangan (1929)",
                        "promo_teaser": "Diskon 10% pastry tempo doeloe khas Belanda",
                        "voucher_code": "ROTIHERITAGE10",
                        "voucher_desc": "Potongan harga 10% untuk pembelian aneka kue kering dan es krim autentik era kolonial.",
                    },
                    {
                        "id": "wp-braga-02",
                        "sequence": 2,
                        "name": "Titik Nol Kilometer Bandung",
                        "category": "heritage",
                        "description": "Monumen patok bersejarah berdirinya Kota Bandung di Jalan Asia Afrika.",
                        "lat": -6.921350,
                        "lon": 107.610890,
                        "radius_m": 50,
                        "story_text": "Pada 25 Mei 1810, Gubernur Jenderal H.W. Daendels menancapkan tongkatnya di tanah ini seraya berucap: 'Zorg, dat als ik terug kom hier een stad is gebouwd' (Usahakan, bila aku kembali ke sini, telah dibangun sebuah kota). Di sinilah titik awal lahirnya Kota Bandung modern.",
                        "umkm_name": "Kopi Toko Djawa Braga",
                        "promo_teaser": "Diskon 15% Es Kopi Awan Legendaris",
                        "voucher_code": "DJAWAESPRESSO15",
                        "voucher_desc": "Diskon 15% untuk semua varian minuman kopi dingin berbasis espresso lokal Jawa Barat.",
                    },
                    {
                        "id": "wp-braga-03",
                        "sequence": 3,
                        "name": "Gedung De Vries & Kawasan Sentral Braga",
                        "category": "heritage",
                        "description": "Departemen store pertama di Bandung dan pusat mode 'Parijs van Java'.",
                        "lat": -6.918450,
                        "lon": 107.609800,
                        "radius_m": 50,
                        "story_text": "Gedung De Vries didirikan pada 1879 sebagai toserba pertama yang melayani kebutuhan perkebunan teh Belanda di Priangan. Gaya arsitektur Indische Empire Style menjadikannya ikon abadi koridor Braga.",
                        "umkm_name": "Braga Permai Resto & Patisserie",
                        "promo_teaser": "Gratis 1 scoop es krim buatan tangan",
                        "voucher_code": "BRAGAPERMAI20",
                        "voucher_desc": "Dapatkan gratis 1 scoop artisanal ice cream rasa vanilla bourbon dengan minimal belanja Rp 50.000.",
                    },
                    {
                        "id": "wp-braga-04",
                        "sequence": 4,
                        "name": "Selasar Seni & Cagar Budaya Gasmin Braga",
                        "category": "heritage",
                        "description": "Ruang temu pegiat seni lukis trotoar dan perupa legendaris Braga.",
                        "lat": -6.916800,
                        "lon": 107.609100,
                        "radius_m": 50,
                        "story_text": "Sepanjang lorong Braga Utara dihiasi pelukis jalanan sejak dekade 1960-an. Para seniman meneruskan tradisi seni rupa modern yang dipelopori ITB dan sanggar-sanggar independen Bandung.",
                        "umkm_name": "Es Cendol Elizabeth Asli Braga",
                        "promo_teaser": "Potongan Rp 5.000 Minuman Tradisional Cendol",
                        "voucher_code": "CENDOLBRAGA5K",
                        "voucher_desc": "Potongan langsung Rp 5.000 untuk paket porsi besar cendol gula aren alami.",
                    },
                ],
            },
            # Trail 2: Cihapit Kuliner
            {
                "trail": {
                    "id": "trail-cihapit-kuliner",
                    "title": "Rute Legenda Rasa & Pasar Warisan Cihapit",
                    "slug": "legenda-rasa-pasar-cihapit",
                    "theme": "kuliner",
                    "description": "Menikmati geliat pagi pasar tertua di Bandung, perpaduan aroma rempah tradisional dan sentuhan kuliner generasi baru.",
                    "city": "Bandung",
                    "distance_km": 1.8,
                    "est_duration_min": 35,
                    "est_steps": 2500,
                    "est_kcal": 130,
                    "price_idr": 20000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-abah-kuliner",
                },
                "waypoints": [
                    {
                        "id": "wp-cihapit-01",
                        "sequence": 1,
                        "name": "Pintu Barat Pasar Tradisional Cihapit",
                        "category": "kuliner",
                        "description": "Pintu masuk pasar basah tertua di Bandung yang berdiri sejak era pra-kemerdekaan.",
                        "lat": -6.907120,
                        "lon": 107.622410,
                        "radius_m": 50,
                        "story_text": "Pasar Cihapit bermula dari pasar lingkungan untuk perumahan pejabat Hindia Belanda di kawasan Riouwstraat. Pasar ini terkenal dengan kebersihan dan kualitas bahan dapur nomor satu di Bandung.",
                        "umkm_name": "Los Kopi & Roti Panggang Tjihapit",
                        "promo_teaser": "Diskon 15% Sarapan Roti Panggang Srikaya",
                        "voucher_code": "TJIKOPISARAPAN",
                        "voucher_desc": "Diskon 15% untuk paket roti kukus/panggang srikaya butter dan teh tarik panas.",
                    },
                    {
                        "id": "wp-cihapit-02",
                        "sequence": 2,
                        "name": "Warung Nasi Sunda Legendaris Bu Eha",
                        "category": "kuliner",
                        "description": "Warung makan legendaris sejak 1947, saksi bisu era perjuangan kemerdekaan.",
                        "lat": -6.906800,
                        "lon": 107.622850,
                        "radius_m": 50,
                        "story_text": "Ibu Eha mendirikan warung ini tepat setelah agresi militer Belanda. Warung bersahaja ini menjadi langganan tetap keluarga Presiden Sukarno saat berkunjung ke Bandung karena racikan pepes jamur dan sambal terasi dadak yang tiada duanya.",
                        "umkm_name": "Warung Nasi Bu Eha",
                        "promo_teaser": "Gratis Porsi Ekstra Lalapan Segar & Sambal Dadak",
                        "voucher_code": "BUEHAPEPES",
                        "voucher_desc": "Gratis 1 porsi pepes tahu/jamur setiap pembelian paket nasi komplit di Warung Bu Eha.",
                    },
                    {
                        "id": "wp-cihapit-03",
                        "sequence": 3,
                        "name": "Sentra Surabi Kinca & Los Kue Subuh",
                        "category": "kuliner",
                        "description": "Deretan gerobak surabi tradisional yang dipanggang di atas tungku tanah liat.",
                        "lat": -6.906200,
                        "lon": 107.623200,
                        "radius_m": 50,
                        "story_text": "Surabi Bandung dibuat dari adonan tepung beras dan santan kelapa murni, dipanggang dengan arang kayu untuk menghasilkan kerak harum renyah. Disajikan dengan saus kinca (gula kelapa cair).",
                        "umkm_name": "Surabi Cihapit Bu Nur",
                        "promo_teaser": "Beli 2 Gratis 1 Surabi Kinca Polos",
                        "voucher_code": "SURABINUR10",
                        "voucher_desc": "Beli 2 surabi varian oncom/telur, dapatkan gratis 1 surabi kinca manis.",
                    },
                ],
            },
            # Trail 3: Perjuangan Bandung Lautan Api
            {
                "trail": {
                    "id": "trail-perjuangan-bla",
                    "title": "Jejak Bandung Lautan Api & Balai Kota",
                    "slug": "jejak-bandung-lautan-api-balaikota",
                    "theme": "sejarah",
                    "description": "Mengenang peristiwa heroik pembakaran Bandung Selatan Maret 1946 serta menikmati sejuknya kanopi pohon purba Balai Kota.",
                    "city": "Bandung",
                    "distance_km": 3.1,
                    "est_duration_min": 55,
                    "est_steps": 4100,
                    "est_kcal": 210,
                    "price_idr": 25000,
                    "difficulty": "Sedang",
                    "curator_id": "cur-ridwan-heritage",
                },
                "waypoints": [
                    {
                        "id": "wp-bla-01",
                        "sequence": 1,
                        "name": "Monumen Bandung Lautan Api Tegalega",
                        "category": "sejarah",
                        "description": "Monumen kobaran api raksasa setinggi 45 meter lambang perlawanan rakyat Priangan.",
                        "lat": -6.937200,
                        "lon": 107.604700,
                        "radius_m": 50,
                        "story_text": "Pada 24 Maret 1946, sekitar 200.000 warga Bandung membakar rumah mereka sendiri dalam waktu tujuh jam untuk mencegah tentara Sekutu dan NICA menggunakan kota Bandung sebagai markas strategis militer.",
                        "umkm_name": "Kios Minuman Rempah Herbal Tegalega",
                        "promo_teaser": "Diskon 20% Minuman Hangat Bandrek Hanjuang",
                        "voucher_code": "BANDREKTEGALEGA",
                        "voucher_desc": "Diskon 20% untuk paket seduhan bandrek jahe merah dan bajigur kelapa muda.",
                    },
                    {
                        "id": "wp-bla-02",
                        "sequence": 2,
                        "name": "Situs Cagar Budaya Penjara Banceuy",
                        "category": "sejarah",
                        "description": "Menara pengawas dan sel nomor 5 tempat Bung Karno ditahan pada 1929.",
                        "lat": -6.920800,
                        "lon": 107.606200,
                        "radius_m": 50,
                        "story_text": "Di dalam sel sempit berukuran 2,5 x 1,5 meter di Penjara Banceuy, Soekarno muda menulis pledoi legendaris 'Indonesia Menggugat' dengan beralaskan kaleng tempat buang air, yang mengguncang peradilan kolonial Hindia Belanda.",
                        "umkm_name": "Warung Kopi Purnama Banceuy (1930)",
                        "promo_teaser": "Potongan Rp 5.000 Roti Selai Srikaya Tradisional",
                        "voucher_code": "PURNAMAROTI",
                        "voucher_desc": "Potongan Rp 5.000 untuk sajian ikonik kopi susu dan roti bakar srikaya buatan sendiri.",
                    },
                    {
                        "id": "wp-bla-03",
                        "sequence": 3,
                        "name": "Taman Sejarah Balai Kota Bandung",
                        "category": "taman",
                        "description": "Taman kota asri dengan relief sejarah wali kota Bandung dari masa ke masa.",
                        "lat": -6.912600,
                        "lon": 107.609700,
                        "radius_m": 50,
                        "story_text": "Gedung Balai Kota dulunya adalah gudang kopi milik Andries de Wilde tahun 1819 sebelum diambil alih oleh Gemeente Bandoeng pada 1927. Taman ini dinaungi pohon trembesi berusia lebih dari satu abad.",
                        "umkm_name": "Kantin Sehat Balai Kota",
                        "promo_teaser": "Potongan Rp 3.000 Jus Buah Alami",
                        "voucher_code": "BALAIKOTAFRESH",
                        "voucher_desc": "Potongan Rp 3.000 untuk jus buah segar tanpa pemanis buatan.",
                    },
                ],
            },
            # Trail 4: Arsitektur Tropis ITB Ganesha
            {
                "trail": {
                    "id": "trail-arsitektur-ganeca",
                    "title": "Harmoni Sains & Arsitektur Tropis ITB - Sabuga",
                    "slug": "harmoni-arsitektur-itb-ganeca",
                    "theme": "arsitektur",
                    "description": "Menyusuri keagungan Aula Barat ITB rancangan Maclaine Pont, jajaran pohon pinus Jalan Ganeca, hingga lembah hijau Sabuga.",
                    "city": "Bandung",
                    "distance_km": 2.8,
                    "est_duration_min": 50,
                    "est_steps": 3700,
                    "est_kcal": 190,
                    "price_idr": 25000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-annisa-fitness",
                },
                "waypoints": [
                    {
                        "id": "wp-ganeca-01",
                        "sequence": 1,
                        "name": "Aula Barat & Timur Kampus ITB Ganesha",
                        "category": "arsitektur",
                        "description": "Karya monumental Ir. Henri Maclaine Pont (1920) dengan konstruksi busur kayu jati raksasa.",
                        "lat": -6.892900,
                        "lon": 107.610500,
                        "radius_m": 50,
                        "story_text": "Aula Barat Technische Hoogeschool te Bandoeng (kini ITB) merupakan contoh puncak arsitektur tropis modern. Pont memadukan struktur busur kayu laminated tanpa tiang tengah dengan bentuk atap tajuk vernakular Nusantara.",
                        "umkm_name": "Kedai Koperasi Salman & ITB",
                        "promo_teaser": "Diskon 10% Kopi Tubruk Ganesha & Merchandise",
                        "voucher_code": "ITBKEDAI10",
                        "voucher_desc": "Diskon 10% untuk buku sastra, notebook, dan seduhan kopi arabika Gunung Puntang.",
                    },
                    {
                        "id": "wp-ganeca-02",
                        "sequence": 2,
                        "name": "Taman Ganesha & Kanopi Mahoni Purba",
                        "category": "taman",
                        "description": "Ruang terbuka hijau peninggalan perancang kota Thomas Karsten di ujung Jalan Ganeca.",
                        "lat": -6.894800,
                        "lon": 107.610900,
                        "radius_m": 50,
                        "story_text": "Taman Ganesha dirancang sebagai 'openbaar park' penghubung kampus ITB dengan kawasan hunian asri Dago. Patung gajah Ganesha di tengah taman melambangkan kebijaksanaan dan ilmu pengetahuan.",
                        "umkm_name": "Corner Gelato & Cafe Ganeca",
                        "promo_teaser": "Diskon 15% Double Scoop Artisanal Gelato",
                        "voucher_code": "GANECAGELATO15",
                        "voucher_desc": "Diskon 15% gelato rasa matcha lokal dan dark chocolate Ciwidey.",
                    },
                    {
                        "id": "wp-ganeca-03",
                        "sequence": 3,
                        "name": "Sasana Budaya Ganesha & Forest Walk Babakan Siliwangi",
                        "category": "alam",
                        "description": "Jalur jalan setapak gantung di atas kanopi hutan kota Babakan Siliwangi.",
                        "lat": -6.890200,
                        "lon": 107.611800,
                        "radius_m": 50,
                        "story_text": "Babakan Siliwangi adalah salah satu hutan kota tertua yang diakui PBB di Asia Tenggara. Forest walk sepanjang 2 kilometer memungkinkan pejalan kaki menyerap udara sejuk pinus di ketinggian 4 meter dari tanah.",
                        "umkm_name": "Foresta Coffee Roastery Baksil",
                        "promo_teaser": "Free Upsize Cold Brew Coffee",
                        "voucher_code": "FORESTABAKSIL",
                        "voucher_desc": "Tukar voucher untuk mendapatkan upgrade ukuran cup besar gratis untuk cold brew lemon coffee.",
                    },
                ],
            },
            # Trail 5: Hutan Dago Tahura
            {
                "trail": {
                    "id": "trail-dago-tahura",
                    "title": "Jalur Hijau Hutan Lindung & Goa Sejarah Dago Pakar",
                    "slug": "jalur-hijau-goa-tahura-djuanda",
                    "theme": "alam",
                    "description": "Trekking jalan kaki kebugaran melewati kanopi pinus Taman Hutan Raya Ir. H. Djuanda dan lorong Goa Belanda & Goa Jepang.",
                    "city": "Bandung",
                    "distance_km": 4.5,
                    "est_duration_min": 80,
                    "est_steps": 6000,
                    "est_kcal": 320,
                    "price_idr": 30000,
                    "difficulty": "Menantang",
                    "curator_id": "cur-annisa-fitness",
                },
                "waypoints": [
                    {
                        "id": "wp-dago-01",
                        "sequence": 1,
                        "name": "Plaza Pintu Utama Tahura Djuanda",
                        "category": "alam",
                        "description": "Gerbang kawasan konservasi seluas 527 hektar di Daerah Aliran Sungai Cikapundung.",
                        "lat": -6.856600,
                        "lon": 107.632700,
                        "radius_m": 50,
                        "story_text": "Tahura Djuanda awalnya adalah Hutan Lindung Pulosari yang ditetapkan sejak 1912. Hutan ini menyimpan 2.500 pohon dari 40 famili tumbuhan, menjadi paru-paru utama penyaring oksigen di utara Bandung.",
                        "umkm_name": "Kios Buah & Madu Hutan Pakar",
                        "promo_teaser": "Diskon 10% Madu Odeng Asli Jawa Barat",
                        "voucher_code": "MADUHUTAN10",
                        "voucher_desc": "Diskon 10% untuk madu mentah lebah hutan asli dari lereng Gunung Tangkuban Parahu.",
                    },
                    {
                        "id": "wp-dago-02",
                        "sequence": 2,
                        "name": "Goa Jepang Dago Pakar",
                        "category": "sejarah",
                        "description": "Kompleks bungker militer tentara pendudukan Jepang tahun 1942.",
                        "lat": -6.858800,
                        "lon": 107.633900,
                        "radius_m": 50,
                        "story_text": "Goa Jepang memiliki empat pintu masuk dan dua saluran pengintai ke arah lembah. Goa ini digali secara paksa oleh pekerja romusha untuk perlindungan logistik dan tempat pertahanan gerilya.",
                        "umkm_name": "Warung Teh Poci & Pisang Pakar",
                        "promo_teaser": "Gratis Pisang Goreng Keju setiap beli 2 teh poci",
                        "voucher_code": "TEHPOCIDAGO",
                        "voucher_desc": "Nikmati kehangatan 1 porsi pisang goreng keju renyah secara gratis dengan pemesanan 2 poci teh melati gula batu.",
                    },
                    {
                        "id": "wp-dago-03",
                        "sequence": 3,
                        "name": "Goa Belanda & Terowongan PLTA Bengkok",
                        "category": "sejarah",
                        "description": "Terowongan bawah tanah kolonial yang dibangun tahun 1906 untuk turbin listrik dan radio militer.",
                        "lat": -6.853700,
                        "lon": 107.634800,
                        "radius_m": 50,
                        "story_text": "Goa Belanda dibangun membendung sungai Cikapundung untuk menggerakkan PLTA Bengkok tertua di Bandung. Menjelang Perang Dunia II, Belanda menambah 15 lorong sebagai stasiun transmisi radio militer rahasia.",
                        "umkm_name": "Warung Taru Dago Atas",
                        "promo_teaser": "Diskon 15% Nasi Kastrol Liwet & Kopi Jahe",
                        "voucher_code": "WARUNGTARU15",
                        "voucher_desc": "Diskon 15% menikmati hidangan nasi kastrol liwet dan wedang jahe di saung kayu berpemandangan lembah.",
                    },
                ],
            },
            # Trail 6: Pecinan & Pasar Baru
            {
                "trail": {
                    "id": "trail-pecinan-cibadak",
                    "title": "Nostalgia Pecinan Kuno & Eksotisme Malam Cibadak",
                    "slug": "pecinan-kuno-pasar-baru-cibadak",
                    "theme": "heritage",
                    "description": "Mengelilingi kawasan pecinan pertama Bandung, kelenteng tertua, deretan ruko bernuansa Tionghoa-Kolonial, dan sentra kuliner malam.",
                    "city": "Bandung",
                    "distance_km": 2.2,
                    "est_duration_min": 40,
                    "est_steps": 2900,
                    "est_kcal": 150,
                    "price_idr": 20000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-abah-kuliner",
                },
                "waypoints": [
                    {
                        "id": "wp-pecinan-01",
                        "sequence": 1,
                        "name": "Klenteng Satya Budhi (Vihara Dharma Ramsi)",
                        "category": "heritage",
                        "description": "Kelenteng tertua di Bandung yang dibangun tahun 1885 di kawasan Jalan Kelenteng.",
                        "lat": -6.923400,
                        "lon": 107.599600,
                        "radius_m": 50,
                        "story_text": "Klenteng Satya Budhi dihiasi ukiran naga kayu jati dan genteng merah khas Tiongkok Selatan. Menjadi pusat festival budaya Imlek dan Cap Go Meh yang membaur harmonis dengan masyarakat Sunda setempat.",
                        "umkm_name": "Toko Kue Pia Tradisional Sin Hap Hoat",
                        "promo_teaser": "Diskon 10% Pia Tradisional Kacang Hijau Asli",
                        "voucher_code": "PIAKUNO10",
                        "voucher_desc": "Diskon 10% pembelian sekotak pia kacang hijau renyah resep turun temurun sejak 1938.",
                    },
                    {
                        "id": "wp-pecinan-02",
                        "sequence": 2,
                        "name": "Pabrik Kopi Aroma Banceuy (1930)",
                        "category": "kuliner",
                        "description": "Pabrik pemanggangan kopi legendaris dengan mesin kayu pembakaran dari Jerman.",
                        "lat": -6.920500,
                        "lon": 107.605300,
                        "radius_m": 50,
                        "story_text": "Didirikan oleh Tan Houw Sian pada 1930. Kopi Aroma memproses biji kopi secara unik: disimpan di gudang khusus selama 5 tahun (Arabika) dan 8 tahun (Robusta) sebelum disangrai demi menurunkan kadar asam secara alami.",
                        "umkm_name": "Toko Kopi Aroma Asli",
                        "promo_teaser": "Cashback Rp 5.000 Pembelian Kemasan Kopi",
                        "voucher_code": "KOPIAROMA5K",
                        "voucher_desc": "Potongan langsung Rp 5.000 untuk pembelian kemasan kopi bubuk Robusta/Arabika 250 gram.",
                    },
                    {
                        "id": "wp-pecinan-03",
                        "sequence": 3,
                        "name": "Koridor Kuliner Malam Cibadak & Sudirman",
                        "category": "kuliner",
                        "description": "Jalanan legendaris pusat jajanan malam akulturasi kuliner Tionghoa dan Nusantara.",
                        "lat": -6.922100,
                        "lon": 107.600900,
                        "radius_m": 50,
                        "story_text": "Kawasan Cibadak telah menjadi urat nadi perdagangan Bandung sejak dibukanya stasiun kereta api pada 1884. Menjelang senja, jalanan ini bermetamorfosis menjadi surga kuliner malam yang semarak.",
                        "umkm_name": "Ronde Jahe Alkateri Cibadak",
                        "promo_teaser": "Gratis Topping Ronde Mini di Setiap Mangkuk",
                        "voucher_code": "RONDEHANGAT",
                        "voucher_desc": "Nikmati semangkuk ronde jahe kuah gula merah hangat dengan gratis ekstra butiran ronde mini kenyal.",
                    },
                ],
            },
            # === RUTE JALAN KAKI BUDAYA JAKARTA ===
            # Trail 7: Kota Tua & Sunda Kelapa
            {
                "trail": {
                    "id": "trail-jkt-kotatua-sundakelapa",
                    "title": "Jejak Sejarah Kota Tua & Pelabuhan Sunda Kelapa",
                    "slug": "kota-tua-sunda-kelapa-heritage",
                    "theme": "heritage",
                    "description": "Menyusuri jantung Oud Batavia dari Museum Fatahillah, Jembatan Kota Intan tertua, hingga pelabuhan kayu pinisi legendaris Sunda Kelapa.",
                    "city": "Jakarta",
                    "distance_km": 3.8,
                    "est_duration_min": 65,
                    "est_steps": 5100,
                    "est_kcal": 245,
                    "price_idr": 25000,
                    "difficulty": "Sedang",
                    "curator_id": "cur-bambang-jakarta",
                },
                "waypoints": [
                    {
                        "id": "wp-jkt-kt-01",
                        "sequence": 1,
                        "name": "Taman Fatahillah & Museum Sejarah Jakarta",
                        "category": "heritage",
                        "description": "Bekas balai kota Batavia (Stadhuis van Batavia) yang dibangun megah tahun 1710.",
                        "lat": -6.135200,
                        "lon": 106.813300,
                        "radius_m": 50,
                        "story_text": "Balai Kota Batavia (Stadhuis) diresmikan oleh Gubernur Jenderal Abraham van Riebeeck pada 1710. Alun-alun berbatu andesit ini menjadi saksi bisu pusat kekuasaan VOC, persidangan kolonial, dan prasasti tonggak peradaban kota Jakarta.",
                        "umkm_name": "Cafe Batavia 1805",
                        "promo_teaser": "Diskon 15% Menu Kopi Rempah Batavia & Poffertjes",
                        "voucher_code": "BATAVIA1805",
                        "voucher_desc": "Dapatkan potongan 15% untuk menikmati kopi rempah klasik dan kue poffertjes autentik menghadap alun-alun Fatahillah.",
                    },
                    {
                        "id": "wp-jkt-kt-02",
                        "sequence": 2,
                        "name": "Jembatan Kota Intan Kali Besar",
                        "category": "arsitektur",
                        "description": "Jembatan jungkit kayu peninggalan Belanda abad ke-17 di atas aliran Kali Besar.",
                        "lat": -6.129400,
                        "lon": 106.811500,
                        "radius_m": 50,
                        "story_text": "Dibangun pada tahun 1628 dengan nama Ophaalbrug van Batavia. Jembatan jungkit berstruktur kayu ulin merah ini dahulu dapat diangkat agar perahu dagang VOC pengangkut rempah bisa melintas masuk dari muara laut ke pusat kota.",
                        "umkm_name": "Kedai Es Selendang Mayang Kali Besar",
                        "promo_teaser": "Gratis Ekstra Selendang Mayang & Kuah Santan",
                        "voucher_code": "SELENDANGKALI",
                        "voucher_desc": "Gratis porsi ekstra agar-agar sagu selendang mayang tradisional Betawi dengan kuah gula merah harum pandan.",
                    },
                    {
                        "id": "wp-jkt-kt-03",
                        "sequence": 3,
                        "name": "Pelabuhan Pinisi Sunda Kelapa",
                        "category": "heritage",
                        "description": "Pelabuhan niaga tertua Jakarta sejak era Kerajaan Pajajaran abad ke-12.",
                        "lat": -6.124800,
                        "lon": 106.808700,
                        "radius_m": 60,
                        "story_text": "Sunda Kelapa telah berdenyut sejak abad ke-12 sebagai bandar utama Kerajaan Sunda. Hingga kini, dermaganya tetap hidup sebagai tempat bersandarnya deretan kapal layar kayu Pinisi Nusantara yang mengarungi kepulauan nusantara.",
                        "umkm_name": "Warung Ikan Bakar Pesisir Sunda Kelapa",
                        "promo_teaser": "Diskon 20% Paket Ikan Bakar Sambal Dabu-Dabu",
                        "voucher_code": "PINISIKELAPA20",
                        "voucher_desc": "Diskon 20% untuk paket ikan bawal bakar segar bumbu kecap manis dengan sambal dabu-dabu khas pesisir.",
                    },
                ],
            },
            # Trail 8: Glodok Pecinan
            {
                "trail": {
                    "id": "trail-jkt-glodok-pecinan",
                    "title": "Wisata Budaya & Kuliner Legendaris Glodok Pecinan",
                    "slug": "glodok-pecinan-kuliner-legendaris",
                    "theme": "kuliner",
                    "description": "Jelajah lorong Gang Gloria, kedai teh otentik Pantjoran Tea House, dan vihara tertua Dharma Bhakti di pecinan tertua Jakarta.",
                    "city": "Jakarta",
                    "distance_km": 2.5,
                    "est_duration_min": 45,
                    "est_steps": 3400,
                    "est_kcal": 170,
                    "price_idr": 20000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-bambang-jakarta",
                },
                "waypoints": [
                    {
                        "id": "wp-jkt-gd-01",
                        "sequence": 1,
                        "name": "Pantjoran Tea House (Gerbang Glodok)",
                        "category": "heritage",
                        "description": "Bangunan cagar budaya tradisi minum teh gratis 'Patekoan' sejak era Kapiten Gan Djie.",
                        "lat": -6.142200,
                        "lon": 106.813600,
                        "radius_m": 50,
                        "story_text": "Tradisi luhur 'Patekoan' (delapan poci teh) digagas oleh Kapitan Gan Djie pada awal abad ke-19, di mana 8 poci teh harum selalu disediakan gratis setiap hari di tepi jalan bagi para musafir dan pekerja yang kelelahan.",
                        "umkm_name": "Pantjoran Tea House Heritage",
                        "promo_teaser": "Diskon 15% Seduhan Teh Oolong Premium",
                        "voucher_code": "TEHPANTJORAN15",
                        "voucher_desc": "Nikmati diskon 15% untuk upacara seduh teh poci keramik tradisional Oolong atau Melati khas Batavia.",
                    },
                    {
                        "id": "wp-jkt-gd-02",
                        "sequence": 2,
                        "name": "Koridor Kuliner Gang Gloria Glodok",
                        "category": "kuliner",
                        "description": "Sentra kuliner peranakkan legendaris tempat kedai Kopi Es Tak Kie beroperasi sejak 1927.",
                        "lat": -6.143800,
                        "lon": 106.814200,
                        "radius_m": 50,
                        "story_text": "Gang Gloria adalah urat nadi kuliner Pecinan Glodok sejak zaman kolonial. Di sini berdiri Kopi Es Tak Kie yang didirikan oleh Liong Kwie Tjong pada 1927, menyajikan seduhan kopi robusta-arabika legendaris lintas generasi.",
                        "umkm_name": "Kopi Es Tak Kie Sejak 1927",
                        "promo_teaser": "Diskon Rp 5.000 Pembelian Es Kopi Hitam / Susu",
                        "voucher_code": "TAKKIEKOPI5K",
                        "voucher_desc": "Potongan langsung Rp 5.000 untuk setiap gelas kopi es hitam autentik resep turun-temurun 1927.",
                    },
                    {
                        "id": "wp-jkt-gd-03",
                        "sequence": 3,
                        "name": "Vihara Dharma Bhakti (Kim Tek Ie 1650)",
                        "category": "heritage",
                        "description": "Kelenteng tertua di Jakarta yang didirikan pada tahun 1650 oleh Letnan Tionghoa Guo Xun Guan.",
                        "lat": -6.145100,
                        "lon": 106.812800,
                        "radius_m": 50,
                        "story_text": "Kim Tek Ie (Kebajikan Emas) adalah klenteng tertua di Jakarta yang berdiri sejak 1650. Menjadi simbol kerukunan antaretnis dan tempat perayaan Cap Go Meh serta peribadatan tiga ajaran (Tridharma) tertua di pulau Jawa.",
                        "umkm_name": "Kue Keranjang & Pia Tradisional Ny. Lauw Petak Sembilan",
                        "promo_teaser": "Beli 2 Kotak Pia Gratis 1 Kue Keranjang Mini",
                        "voucher_code": "PIALAUPETAK",
                        "voucher_desc": "Dapatkan gratis 1 kue keranjang daun pisang mini untuk pembelian 2 kotak pia kacang merah Petak Sembilan.",
                    },
                ],
            },
            # Trail 9: Lapangan Banteng & Gedung Kesenian Jakarta
            {
                "trail": {
                    "id": "trail-jkt-lapangan-banteng",
                    "title": "Arsitektur Klasik Lapangan Banteng - Gedung Kesenian Jakarta",
                    "slug": "lapangan-banteng-arsitektur-katedral-istiqlal",
                    "theme": "arsitektur",
                    "description": "Menikmati harmoni toleransi dan kemegahan arsitektur Weltevreden: Monumen Pembebasan Irian Barat, Katedral Neo-Gotik, dan Istiqlal.",
                    "city": "Jakarta",
                    "distance_km": 3.0,
                    "est_duration_min": 50,
                    "est_steps": 4000,
                    "est_kcal": 195,
                    "price_idr": 20000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-bambang-jakarta",
                },
                "waypoints": [
                    {
                        "id": "wp-jkt-lb-01",
                        "sequence": 1,
                        "name": "Monumen Pembebasan Irian Barat (Taman Lapangan Banteng)",
                        "category": "arsitektur",
                        "description": "Ruang terbuka bersejarah bekas Waterlooplein dengan monumen karya Henk Ngantung.",
                        "lat": -6.170300,
                        "lon": 106.835400,
                        "radius_m": 60,
                        "story_text": "Dahulu bernama Waterlooplein (Lapangan Singa) di era Batavia Selatan. Di tengahnya berdiri megah Monumen Pembebasan Irian Barat yang diresmikan Presiden Soekarno pada 1963, dirancang oleh seniman Henk Ngantung dan dipahat pematung Team Pematung Keluarga Arca Yogyakarta.",
                        "umkm_name": "Kedai Roti Bakar & Es Kelapa Banteng",
                        "promo_teaser": "Diskon 10% Roti Bakar Coklat Keju & Kelapa Muda",
                        "voucher_code": "BANTENGSEGAR10",
                        "voucher_desc": "Diskon 10% untuk pemesanan roti bakar gandum dengan es kelapa muda murni segar pelepas dahaga jalan santai.",
                    },
                    {
                        "id": "wp-jkt-lb-02",
                        "sequence": 2,
                        "name": "Simbol Harmoni: Katedral Jakarta & Masjid Istiqlal",
                        "category": "arsitektur",
                        "description": "Dua mahakarya arsitektur tempat ibadah yang berdiri berhadapan dan terhubung Terowongan Silaturahim.",
                        "lat": -6.169100,
                        "lon": 106.832700,
                        "radius_m": 60,
                        "story_text": "Gereja Katedral bergaya Neo-Gotik Eropa diresmikan tahun 1901 dengan menara besi tempa setinggi 60 meter. Tepat di seberangnya berdiri Masjid Istiqlal karya arsitek F. Silaban, masjid terbesar di Asia Tenggara yang dirancang melambangkan kemerdekaan bangsa.",
                        "umkm_name": "Kantin Dapur Toleransi Masjid Istiqlal",
                        "promo_teaser": "Diskon 15% Minuman Herbal Bir Pletok Dingin",
                        "voucher_code": "HARMONIS15",
                        "voucher_desc": "Diskon 15% untuk minuman rempah tradisional Bir Pletok Betawi non-alkohol pereda lelah berjalan kaki.",
                    },
                    {
                        "id": "wp-jkt-lb-03",
                        "sequence": 3,
                        "name": "Gedung Kesenian Jakarta (Schouwburg 1821)",
                        "category": "heritage",
                        "description": "Gedung pertunjukan teater neo-renaisans tertua yang dibangun oleh Daendels dan Raffles.",
                        "lat": -6.166600,
                        "lon": 106.833900,
                        "radius_m": 50,
                        "story_text": "Dibangun pertama kali atas prakarsa Thomas Stamford Raffles pada 1814 sebagai teater bambu, lalu disempurnakan menjadi gedung neo-renaisans megah oleh arsitek J.C. Schultze pada 1821. Gedung ini juga tempat Kongres Pemuda I 1926 bersidang.",
                        "umkm_name": "Toko Coklat Klasik & Pastry Pasar Baru",
                        "promo_teaser": "Gratis Coklat Praline Mini Buatan Rumah",
                        "voucher_code": "GKJCOKLAT",
                        "voucher_desc": "Gratis 2 keping coklat praline artisanal setiap pembelian kue pai apel atau minuman coklat hangat.",
                    },
                ],
            },
            # Trail 10: Menteng & Cikini
            {
                "trail": {
                    "id": "trail-jkt-menteng-cikini",
                    "title": "Jejak Proklamasi & Pesona Cagar Budaya Menteng - Cikini",
                    "slug": "proklamasi-menteng-cikini-heritage",
                    "theme": "sejarah",
                    "description": "Menapaki jalur proklamasi kemerdekaan RI, kawasan kota taman tertua Hindia Belanda di Menteng, dan seni budaya Cikini Raden Saleh.",
                    "city": "Jakarta",
                    "distance_km": 3.6,
                    "est_duration_min": 60,
                    "est_steps": 4800,
                    "est_kcal": 230,
                    "price_idr": 25000,
                    "difficulty": "Sedang",
                    "curator_id": "cur-mpok-siti-betawi",
                },
                "waypoints": [
                    {
                        "id": "wp-jkt-mc-01",
                        "sequence": 1,
                        "name": "Tugu Proklamasi (Pegangsaan Timur 56)",
                        "category": "sejarah",
                        "description": "Lokasi pembacaan Teks Proklamasi Kemerdekaan RI oleh Bung Karno dan Bung Hatta pada 17 Agustus 1945.",
                        "lat": -6.200100,
                        "lon": 106.846600,
                        "radius_m": 50,
                        "story_text": "Di halaman rumah Pegangsaan Timur 56 inilah, tepat pukul 10.00 pagi hari Jumat bulan Ramadan 1945, bendera Merah Putih jahitan Ibu Fatmawati dikibarkan pertama kali mengiringi kumandang Indonesia Raya.",
                        "umkm_name": "Kedai Kopi Proklamasi Pegangsaan",
                        "promo_teaser": "Diskon 15% Kopi Tubruk Gayo Bung Karno",
                        "voucher_code": "PROKLAMASI45",
                        "voucher_desc": "Diskon 15% seduhan kopi tubruk pekat favorit para pejuang kemerdekaan disertai camilan singkong goreng.",
                    },
                    {
                        "id": "wp-jkt-mc-02",
                        "sequence": 2,
                        "name": "Taman Suropati & Kawasan Niew-Menteng",
                        "category": "alam",
                        "description": "Taman kota asri rindang yang dirancang P.A.J. Moojen sebagai konsep kota taman pertama di Indonesia.",
                        "lat": -6.199400,
                        "lon": 106.832200,
                        "radius_m": 50,
                        "story_text": "Taman Suropati (Burgemeester Bisschopplein) dibangun tahun 1920 sebagai pusat kawasan Menteng. Dikelilingi pohon mahoni rindang dan 6 monumen patung karya seniman kenamaan anggota ASEAN.",
                        "umkm_name": "Gado-Gado Legendaris Taman Suropati",
                        "promo_teaser": "Gratis Es Teh Manis setiap porsi Gado-Gado",
                        "voucher_code": "SUROPATIGADO",
                        "voucher_desc": "Dapatkan gratis segelas es teh manis wangi melati setiap memesan seporsi gado-gado siram bumbu kacang medok.",
                    },
                    {
                        "id": "wp-jkt-mc-03",
                        "sequence": 3,
                        "name": "Taman Ismail Marzuki & Rumah Pelukis Raden Saleh",
                        "category": "heritage",
                        "description": "Pusat kesenian ibu kota di bekas lahan kebun raya milik perintis seni lukis modern Indonesia.",
                        "lat": -6.190100,
                        "lon": 106.839800,
                        "radius_m": 50,
                        "story_text": "Kawasan Cikini ini awalnya merupakan kebun binatang dan kediaman istana pelukis maestro Raden Saleh Syarif Bustaman pada 1852. Pada era Gubernur Ali Sadikin tahun 1968, lahan ini disulap menjadi Taman Ismail Marzuki sebagai kawah candradimuka seniman Nusantara.",
                        "umkm_name": "Toko Roti Tjap Cikini 1898",
                        "promo_teaser": "Diskon 10% Roti Gambang Gula Jawa & Kopi Susu",
                        "voucher_code": "ROTIJADUL10",
                        "voucher_desc": "Potongan 10% menikmati roti gambang bumbu kayu manis klasik dan es kopi susu kampung di teras Cikini.",
                    },
                ],
            },
            # Trail 11: Setu Babakan Betawi
            {
                "trail": {
                    "id": "trail-jkt-setu-babakan",
                    "title": "Harmoni & Kearifan Budaya Betawi Setu Babakan",
                    "slug": "setu-babakan-perkampungan-budaya-betawi",
                    "theme": "alam",
                    "description": "Menikmati keteduhan danau alami, rumah panggung tradisional Betawi Bapang, kesenian Gambang Kromong, dan kuliner kerak telor asli.",
                    "city": "Jakarta",
                    "distance_km": 4.2,
                    "est_duration_min": 55,
                    "est_steps": 5500,
                    "est_kcal": 260,
                    "price_idr": 20000,
                    "difficulty": "Mudah",
                    "curator_id": "cur-mpok-siti-betawi",
                },
                "waypoints": [
                    {
                        "id": "wp-jkt-sb-01",
                        "sequence": 1,
                        "name": "Gerbang Utama Danau Setu Babakan",
                        "category": "alam",
                        "description": "Danau resapan alami seluas 30 hektar penyangga ekosistem flora-fauna Jakarta Selatan.",
                        "lat": -6.341400,
                        "lon": 106.824200,
                        "radius_m": 60,
                        "story_text": "Danau Setu Babakan ditetapkan sebagai Kawasan Perkampungan Budaya Betawi sejak tahun 2000 untuk merawat keaslian ekosistem air tawar sekaligus benteng terakhir perlindungan seni tradisi warga asli Jakarta.",
                        "umkm_name": "Gerobak Kerak Telor Asli Mpok Romlah",
                        "promo_teaser": "Ekstra Taburan Serundeng Gurih & Telur Bebek",
                        "voucher_code": "KERAKTELORASLI",
                        "voucher_desc": "Dapatkan gratis ekstra taburan serundeng kelapa sangrai dan bawang goreng renyah untuk setiap porsi kerak telor bebek matang arang.",
                    },
                    {
                        "id": "wp-jkt-sb-02",
                        "sequence": 2,
                        "name": "Museum Rumah Adat Kebaya & Bapang Betawi",
                        "category": "heritage",
                        "description": "Kompleks rumah tradisional Betawi berornamen gigi balang dan balai sanggar tari topeng.",
                        "lat": -6.342900,
                        "lon": 106.826500,
                        "radius_m": 50,
                        "story_text": "Rumah adat Bapang memiliki ciri khas atap pelana berornamen ukir 'gigi balang' yang melambangkan kejujuran, keteguhan hati, dan kesabaran orang Betawi dalam menjalani hidup bermasyarakat.",
                        "umkm_name": "Sanggar Batik Betawi Gobang",
                        "promo_teaser": "Diskon 10% Selendang Batik Motif Ondel-Ondel",
                        "voucher_code": "BATIKBETAWI10",
                        "voucher_desc": "Potongan 10% untuk kain batik cap buatan tangan bermotif ikonik monas dan ondel-ondel khas Setu Babakan.",
                    },
                    {
                        "id": "wp-jkt-sb-03",
                        "sequence": 3,
                        "name": "Dermaga Pulau Buatan & Saung Kuliner Pesisir Danau",
                        "category": "kuliner",
                        "description": "Pusat jajanan tradisional dodol Betawi aduk kawah dan es cendol pandan di tepi danau.",
                        "lat": -6.339800,
                        "lon": 106.828100,
                        "radius_m": 60,
                        "story_text": "Tradisi mengaduk dodol Betawi di kawah tembaga besar selama 8 jam tanpa henti adalah simbol gotong royong dan silaturahmi kekeluargaan masyarakat Betawi menjelang hari raya kemenangan.",
                        "umkm_name": "Dapur Dodol Ny. Nurlela Setu Babakan",
                        "promo_teaser": "Beli 1 Besek Dodol Gratis 1 Toples Kembang Goyang",
                        "voucher_code": "DODOLGURIH",
                        "voucher_desc": "Setiap pembelian 1 besek dodol ketan hitam legit, dapatkan gratis 1 toples kue kembang goyang renyah.",
                    },
                ],
            },
        ]

        for t_entry in trails_data:
            trail_dict = t_entry["trail"]
            waypoints_list = t_entry["waypoints"]

            existing_trail = db.query(Trail).filter(Trail.id == trail_dict["id"]).first()
            if not existing_trail:
                trail_obj = Trail(**trail_dict)
                db.add(trail_obj)
                db.flush()

                for wp_dict in waypoints_list:
                    wp_obj = Waypoint(trail_id=trail_obj.id, **wp_dict)
                    db.add(wp_obj)
                print(f"Rute '{trail_dict['title']}' ({len(waypoints_list)} pos) berhasil dibuat.")
            else:
                # Update attributes if needed and ensure waypoints exist
                for key, val in trail_dict.items():
                    setattr(existing_trail, key, val)
                for wp_dict in waypoints_list:
                    existing_wp = db.query(Waypoint).filter(Waypoint.id == wp_dict["id"]).first()
                    if not existing_wp:
                        wp_obj = Waypoint(trail_id=existing_trail.id, **wp_dict)
                        db.add(wp_obj)
                print(f"Rute '{trail_dict['title']}' sudah ada di database (diverifikasi/disinkron).")

        db.commit()
        total_trails = db.query(Trail).count()
        print("\n=== SEMUA DATA AWAL BERHASIL DI-SEED ===")
        print(f"- Akun Demo    : {demo_email} (password: demo1234)")
        print(f"- B2B Test Key : {default_key}")
        print(f"- Total Rute   : {total_trails} rute jalan kaki budaya di Bandung & Jakarta")

    except Exception as e:
        db.rollback()
        print(f"Error saat seeding data: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
