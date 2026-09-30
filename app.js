const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;

const apiKey = "TmW3n2IbOKaZxkghOoYB";

app.use(express.static(path.join(__dirname, "public")));

function cariWilayah(feature, daftarTipe) {
    const daftarWilayah = [
        feature,
        ...(feature.context || [])
    ];

    const hasil = daftarWilayah.find((item) =>
        daftarTipe.some((tipe) =>
            item.id?.startsWith(tipe + ".")
        )
    );

    return hasil?.text ||
        hasil?.place_name ||
        "Tidak tersedia";
}

app.get("/api/lokasi", async (req, res) => {
    const lokasi = req.query.lokasi?.trim();

    if (!lokasi) {
        return res.status(400).json({
            message: "Lokasi harus diisi"
        });
    }

    const url =
        "https://api.maptiler.com/geocoding/" +
        encodeURIComponent(lokasi) +
        ".json";

    try {
        const response = await axios.get(url, {
            params: {
                key: apiKey,
                language: "id",
                limit: 1
            },
            timeout: 10000
        });

        const feature = response.data.features?.[0];

        if (!feature) {
            return res.status(404).json({
                message: "Lokasi tidak ditemukan"
            });
        }

        const koordinat =
            feature.center ||
            feature.geometry.coordinates;

        res.json({
            lokasi:
                feature.place_name ||
                feature.text,

            negara: cariWilayah(
                feature,
                ["country"]
            ),

            provinsi: cariWilayah(
                feature,
                ["region"]
            ),

            kecamatan: cariWilayah(
                feature,
                [
                    "municipal_district",
                    "municipality",
                    "county",
                    "subregion",
                    "locality"
                ]
            ),

            longitude: koordinat[0],
            latitude: koordinat[1]
        });
    } catch (error) {
        console.error(
            error.response?.data ||
            error.message
        );

        res.status(500).json({
            message: "Gagal mengambil data dari MapTiler"
        });
    }
});

app.listen(PORT, () => {
    console.log(
        `Server berjalan di http://localhost:${PORT}`
    );
});