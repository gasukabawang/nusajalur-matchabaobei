import os
import sys
from pathlib import Path
import yaml

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app


def export_openapi():
    print("Mengekspor skema OpenAPI dari FastAPI...")
    openapi_schema = app.openapi()

    # Paths to write
    backend_openapi_path = backend_dir / "openapi.yaml"
    root_openapi_path = backend_dir.parent / "openapi.yaml"

    yaml_content = yaml.dump(openapi_schema, sort_keys=False, allow_unicode=True)

    with open(backend_openapi_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"OpenAPI YAML berhasil ditulis ke: {backend_openapi_path}")

    with open(root_openapi_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"OpenAPI YAML berhasil ditulis ke: {root_openapi_path}")


if __name__ == "__main__":
    export_openapi()
