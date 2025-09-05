import json
import os

import torch
import torchvision
from torch import nn


def create_vit_model(num_classes: int = 4, seed: int = 43):
    """Creates a ViT-B/16 feature extractor model and transforms.

    Args:
        num_classes (int, optional): number of target classes.
        seed (int, optional): random seed value for output layer. Defaults to 42.

    Returns:
        model (torch.nn.Module): ViT-B/16 feature extractor model.
        transforms (torchvision.transforms): ViT-B/16 image transforms.
    """
    # Create ViT_B_16 pretrained weights, transforms and model
    weights = torchvision.models.ViT_B_16_Weights.DEFAULT
    transforms = weights.transforms()
    model = torchvision.models.vit_b_16(weights=weights)

    for param in model.parameters():
        param.requires_grad = False

    torch.manual_seed(seed)
    model.heads = nn.Sequential(
        nn.Linear(
            in_features=768,
            out_features=num_classes,
        )
    )

    return model, transforms


def create_effnetb2_model(num_classes: int = 2, seed: int = 43):
    """Creates an EfficientNetB2 feature extractor model and transforms.

    Args:
        num_classes (int, optional): number of classes in the classifier head.
            Defaults to 2.
        seed (int, optional): random seed value. Defaults to 43.

    Returns:
        model (torch.nn.Module): EffNetB2 feature extractor model.
        transforms (torchvision.transforms): EffNetB2 image transforms.
    """
    # Create EffNetB2 pretrained weights, transforms and model
    weights = torchvision.models.EfficientNet_B2_Weights.DEFAULT
    transforms = weights.transforms()
    model = torchvision.models.efficientnet_b2(weights=weights)

    # Freeze all layers in base model
    for param in model.parameters():
        param.requires_grad = False

    # Change classifier head with random seed for reproducibility
    torch.manual_seed(seed)
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3, inplace=True),
        nn.Linear(in_features=1408, out_features=num_classes),
    )

    return model, transforms


def load_labels(model_basename: str, default_labels: list[str]) -> list[str]:
    """Load class labels for a given model from optional label files.

    Looks for files under the server/models directory:
      - models/<model_basename>.labels.txt  (one label per line)
      - models/<model_basename>.labels.json (a JSON array of labels)

    Falls back to the provided default_labels if no file is found.
    """
    # Resolve relative to the server folder (this file is under server/app/utils)
    server_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    models_dir = os.path.join(server_root, "models")

    txt_path = os.path.join(models_dir, f"{model_basename}.labels.txt")
    json_path = os.path.join(models_dir, f"{model_basename}.labels.json")

    try:
        if os.path.exists(txt_path):
            with open(txt_path, "r", encoding="utf-8") as f:
                labels = [line.strip() for line in f if line.strip()]
                if labels:
                    return labels
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list) and all(isinstance(x, str) for x in data) and data:
                    return data
    except Exception:
        # Silently fall back to default on any parsing/IO error
        pass

    return default_labels


def load_index_map(model_basename: str, num_classes: int) -> list[int] | None:
    """Load an optional index remapping for model outputs.

    Looks for models/<model_basename>.indexmap.json containing a JSON array of integers
    mapping desired label indices to model output indices. For example, if the desired
    labels are [A, B, C] but the model was trained with [B, C, A], the index map would be
    [2, 0, 1] meaning:
      desired[0] (A) comes from model[2]
      desired[1] (B) comes from model[0]
      desired[2] (C) comes from model[1]

    Returns None if no valid mapping file exists.
    """
    server_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    models_dir = os.path.join(server_root, "models")
    json_path = os.path.join(models_dir, f"{model_basename}.indexmap.json")

    try:
        if os.path.exists(json_path):
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if (
                    isinstance(data, list)
                    and len(data) == num_classes
                    and all(isinstance(x, int) for x in data)
                    and all(0 <= x < num_classes for x in data)
                ):
                    return data
    except Exception:
        pass

    return None


def reorder_probs(pred_probs: torch.Tensor, index_map: list[int]) -> torch.Tensor:
    """Reorder class probabilities using the provided index map.

    index_map maps desired label indices to model output indices. We gather from pred_probs
    accordingly: new_probs[:, i] = old_probs[:, index_map[i]].
    """
    if pred_probs.ndim != 2:
        raise ValueError("pred_probs must be a 2D tensor [batch, classes]")
    device = pred_probs.device
    idx = torch.tensor(index_map, dtype=torch.long, device=device)
    return pred_probs.index_select(dim=1, index=idx)


def validate_image_confidence(pred_probs, class_names, image_type="general"):
    """Generic confidence validation for any model"""
    pred_labels_and_probs = {class_names[i]: float(pred_probs[0][i]) for i in range(len(class_names))}
    max_confidence = max(pred_labels_and_probs.values())

    # Calculate entropy for uncertainty
    entropy = -torch.sum(pred_probs * torch.log(pred_probs + 1e-8), dim=1)
    entropy_value = float(entropy[0])

    # Thresholds (can be adjusted per model type)
    CONFIDENCE_THRESHOLD = 0.7
    UNCERTAINTY_THRESHOLD = 0.4
    ENTROPY_THRESHOLD = 1.2

    if entropy_value > ENTROPY_THRESHOLD or max_confidence < UNCERTAINTY_THRESHOLD:
        return {
            "prediction": "Uncertain/Unrelated",
            "confidence": float(max_confidence),
            "entropy": entropy_value,
            "message": f"This doesn't appear to be a valid {image_type} image",
            "probabilities": pred_labels_and_probs,
        }
    elif max_confidence < CONFIDENCE_THRESHOLD:
        return {
            "prediction": "Low Confidence",
            "confidence": float(max_confidence),
            "entropy": entropy_value,
            "message": "Low confidence prediction - please verify with medical professional",
            "probabilities": pred_labels_and_probs,
        }
    else:
        predicted_class = max(pred_labels_and_probs, key=pred_labels_and_probs.get)
        return {
            "prediction": predicted_class,
            "confidence": float(max_confidence),
            "entropy": entropy_value,
            "message": f"Model Diagnosis: {predicted_class} with confidence {max_confidence:.2f}",
            "probabilities": pred_labels_and_probs,
        }
