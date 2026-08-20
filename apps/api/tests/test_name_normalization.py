"""
Unit tests for Name Normalization Service (Arabic and phonetic variants)
"""
from app.services.name_normalization import normalize_arabic_name, normalize_name


def test_arabic_name_normalization_equivalence():
    norm1 = normalize_arabic_name("Mohamed Ahmed")
    norm2 = normalize_arabic_name("Mohammed Ahmad")
    norm3 = normalize_arabic_name("Mohd Ahmad")
    norm4 = normalize_arabic_name("Al-Mohamed El-Ahmed")

    assert norm1 == norm2
    assert norm1 == norm3
    assert norm1 == norm4


def test_arabic_name_prefix_stripping():
    assert normalize_arabic_name("Al-Mansoor") == "mansur"
    assert normalize_arabic_name("El-Sayed") == "saied"
    assert normalize_arabic_name("Tariq Bin Ziyad") == "tariq ziad"


def test_arabic_name_stem_standardization():
    assert normalize_arabic_name("Mohammad") == "mohamed"
    assert normalize_arabic_name("Muhamad") == "mohamed"
    assert normalize_arabic_name("Mohd") == "mohamed"
    assert normalize_arabic_name("Mahmood") == "mahmud"
    assert normalize_arabic_name("Hussain") == "husein"


def test_consonant_and_vowel_normalization():
    assert normalize_arabic_name("Hassan") == "hasan"
    assert normalize_arabic_name("Khaled") == "kaled"
    assert normalize_arabic_name("Abdullah") == "abd"
    assert normalize_arabic_name("") == ""


def test_normalize_general_name():
    assert normalize_name("  Vladimir   Putin  ") == "vladimir putin"
    assert normalize_name("John Doe") == "john doe"
