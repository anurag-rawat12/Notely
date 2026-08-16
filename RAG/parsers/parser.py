import os

os.environ["TORCHDYNAMO_DISABLE"] = "1"

import json
import time
from pathlib import Path
from rich import print

import numpy as np
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    AcceleratorOptions,
    AcceleratorDevice,
    TableFormerMode,
    RapidOcrOptions,
)
from docling.datamodel.base_models import InputFormat
from rapidocr_onnxruntime import RapidOCR

rapid_engine = RapidOCR()  # load once, reuse across all images


def build_converter() -> DocumentConverter:
    pipeline_options = PdfPipelineOptions()

    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = RapidOcrOptions(force_full_page_ocr=False)

    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.mode = TableFormerMode.FAST

    pipeline_options.generate_picture_images = True
    pipeline_options.images_scale = 2.0

    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=min(4, os.cpu_count()),
        device=AcceleratorDevice.CPU,
    )

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )
    return converter


def ocr_image(pil_image) -> str:
    """Runs RapidOCR on a single PIL image, returns extracted text."""
    img_array = np.array(pil_image)
    result, _ = rapid_engine(img_array)
    if not result:
        return ""
    return " ".join([line[1] for line in result])


def extract_pictures(result, pdf_stem: str) -> list[dict]:
    """
    Runs OCR on each embedded picture Docling extracted (diagrams,
    screenshots, handwritten notes) to pull out any text that isn't
    part of the page's selectable text layer. Images are processed
    in-memory only — nothing is written to disk here.
    """
    pictures = result.document.pictures
    if not pictures:
        return []

    image_chunks = []
    for i, picture in enumerate(pictures):
        pil_image = picture.image.pil_image
        if pil_image is None:
            continue

        print(f"  OCR-ing image {i}...")
        extracted_text = ocr_image(pil_image)

        prov = picture.prov[0] if picture.prov else None
        image_chunks.append(
            {
                "image_id": f"img_{i:03d}",
                "page": prov.page_no if prov else None,
                "image_width": pil_image.width,
                "image_height": pil_image.height,
                "extracted_text": extracted_text,
            }
        )
        print(f"    → {len(extracted_text)} chars extracted")

    return image_chunks


def parse_document(
    file_path: str, max_pages: int | None = None
) -> tuple[str, list[dict]]:
    converter = build_converter()

    if max_pages:
        result = converter.convert(file_path, max_num_pages=max_pages)
    else:
        result = converter.convert(file_path)

    markdown = result.document.export_to_markdown()

    pdf_stem = Path(file_path).stem
    print(f"\nExtracting images ({len(result.document.pictures)} found)...")
    image_chunks = extract_pictures(result, pdf_stem)

    # append image OCR text to the markdown so it's part of your chunkable content
    if image_chunks:
        image_text_blocks = [
            f"**Image (page {c['page']}):**\n{c['extracted_text']}"
            for c in image_chunks
            if c["extracted_text"].strip()
        ]
        if image_text_blocks:
            markdown += "\n\n**Text extracted from images:**\n" + "\n\n".join(
                image_text_blocks
            )

    return markdown, image_chunks
