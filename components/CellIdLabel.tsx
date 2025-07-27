"use client";
import { MarkdownCellData } from "@/types";
import React from "react";
import "./CellIdLabel.css";

interface CellIdLabelProps {
  editingId: boolean;
  setEditingId: React.Dispatch<React.SetStateAction<boolean>>;
  idInput: string;
  setIdInput: React.Dispatch<React.SetStateAction<string>>;
  cell: MarkdownCellData;
  onUpdateCellId: (oldId: string, newId: string) => void;
}
export function CellIdLabel(props: CellIdLabelProps) {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-1 right-2 text-xs text-gray-600"
    >
      {props.editingId ? (
        <input
          type="text"
          value={props.idInput}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            props.setIdInput(e.target.value)
          }
          onBlur={() => {
            props.setEditingId(false);

            if (props.idInput !== props.cell.id && props.idInput.trim()) {
              props.onUpdateCellId(props.cell.id, props.idInput.trim());
            } else {
              props.setIdInput(props.cell.id);
            }
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              props.setEditingId(false);

              if (props.idInput !== props.cell.id && props.idInput.trim()) {
                props.onUpdateCellId(props.cell.id, props.idInput.trim());
              } else {
                props.setIdInput(props.cell.id);
              }
            } else if (e.key === "Escape") {
              props.setEditingId(false);
              props.setIdInput(props.cell.id);
            }
          }}
          className="bg-gray-900 text-gray-200 border border-gray-700 rounded px-1 py-0.5 text-xs w-28"
          placeholder="Enter cell ID"
          title="Edit cell ID"
        />
      ) : (
        <span
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
            e.stopPropagation();
            props.setEditingId(true);
          }}
          title="Double-click to edit cell ID"
          className="pointer-events-auto"
        >
          Id: {props.cell.id.split("-")[0]}
        </span>
      )}
    </div>
  );
}
