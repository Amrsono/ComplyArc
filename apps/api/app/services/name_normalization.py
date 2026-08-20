"""
ComplyArc — Name Normalization Service
Handles multilingual transliteration, Arabic prefix stripping, and phonetic normalization.
"""
import re


def normalize_arabic_name(name: str) -> str:
    """
    Normalize English transliterations of Arabic names for enhanced fuzzy matching.
    Maps common spelling variations (e.g. 'Mohamed', 'Mohammad', 'Mohd') to a standardized root.
    """
    if not name:
        return ""

    name = name.lower().strip()

    # 1. Strip common prefixes (al-, el-, abd, bin, bint, ibn)
    name = re.sub(r'\b(al|el|ar|as|ad|ash|an)-?', '', name)
    name = re.sub(r'\b(bin|bint|ibn)\b', '', name)

    # 2. Normalize "Abd Al" variations
    name = re.sub(r'\babd(ul|allah|ullah|el|al| allah| ullah)?\b', 'abd', name)

    # 3. Standardize common name stems
    name = re.sub(r'\b(mohamed|mohammed|muhammad|muhamed|mohammad|muhamad|mohd)\b', 'mohamed', name)
    name = re.sub(r'\b(ahmed|ahmad|ahmadu)\b', 'ahmed', name)
    name = re.sub(r'\b(mahmoud|mahmood|mahmud)\b', 'mahmoud', name)
    name = re.sub(r'\b(hussein|hussain|husein|husain)\b', 'hussein', name)
    name = re.sub(r'\b(hassan|hasan)\b', 'hassan', name)
    name = re.sub(r'\b(khaled|khalid)\b', 'khaled', name)
    name = re.sub(r'\b(yousef|yusuf|yosef)\b', 'yousef', name)

    # 4. Phonetic mapping for vowels and consonants
    name = name.replace('ou', 'u').replace('oo', 'u')
    name = name.replace('ee', 'i').replace('y', 'i')
    name = name.replace('gh', 'g').replace('kh', 'k')
    name = name.replace('ph', 'f')

    # 5. Remove consecutive duplicate consonants
    name = re.sub(r'([a-z])\1', r'\1', name)

    return " ".join(name.split())


def normalize_name(name: str) -> str:
    """Normalize arbitrary names for fuzzy matching comparison."""
    if not name:
        return ""
    name = " ".join(name.lower().strip().split())
    return normalize_arabic_name(name)
