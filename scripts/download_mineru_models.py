"""
Download MinerU models from ModelScope (China mirror)
"""
import os
import sys

def download_models():
    """Download MinerU models"""
    models_dir = r"C:\Users\Garo\.magic-pdf\models"
    os.makedirs(models_dir, exist_ok=True)

    print(f"Models directory: {models_dir}")

    try:
        from modelscope.hub.snapshot_download import snapshot_download

        # Download MinerU models from ModelScope
        print("Downloading MinerU models from ModelScope...")
        model_dir = snapshot_download(
            'opendatalab/PDF-Extract-Kit',
            cache_dir=models_dir
        )
        print(f"Models downloaded to: {model_dir}")

    except ImportError:
        print("ModelScope not installed. Trying alternative method...")

        # Alternative: Download from Hugging Face
        try:
            from huggingface_hub import snapshot_download

            print("Downloading from Hugging Face...")
            model_dir = snapshot_download(
                repo_id="opendatalab/PDF-Extract-Kit",
                cache_dir=models_dir,
                local_dir=models_dir,
                local_dir_use_symlinks=False
            )
            print(f"Models downloaded to: {model_dir}")

        except Exception as e:
            print(f"Hugging Face download failed: {e}")
            print("\nPlease manually download models from:")
            print("https://huggingface.co/opendatalab/PDF-Extract-Kit")
            print(f"And extract to: {models_dir}")
            return False

    except Exception as e:
        print(f"Download failed: {e}")
        return False

    return True

if __name__ == "__main__":
    success = download_models()
    sys.exit(0 if success else 1)
