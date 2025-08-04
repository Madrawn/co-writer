import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatInput from "./ChatInput";

describe("ChatInput", () => {
  const baseProps = {
    input: "",
    setInput: vi.fn(),
    handleSend: vi.fn(),
    interimSpeech: "",
    toggleRecordingMode: vi.fn(),
    recordingMode: "auto-stop" as const,
    isListening: false,
    toggleListening: vi.fn(),
    isLoading: false,
    countdown: null,
  };

  beforeEach(() => {
    Object.values(baseProps).forEach((prop) => {
      if (typeof prop === "function" && "mock" in prop) {
        prop.mockReset();
      }
    });
  });

  it("renders textarea and buttons", () => {
    render(<ChatInput {...baseProps} />);
    expect(screen.getByPlaceholderText(/ask cowriter/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /voice input/i })).toBeInTheDocument();
  });

  it("disables textarea and send button when loading", () => {
    render(<ChatInput {...baseProps} isLoading={true} />);
    expect(screen.getByPlaceholderText(/ask cowriter/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("disables textarea when listening", () => {
    render(<ChatInput {...baseProps} isListening={true} />);
    expect(screen.getByPlaceholderText(/ask cowriter/i)).toBeDisabled();
  });

  it("calls setInput on textarea change", () => {
    render(<ChatInput {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/ask cowriter/i);
    fireEvent.change(textarea, { target: { value: "hello" } });
    expect(baseProps.setInput).toHaveBeenCalledWith("hello");
  });

  it("calls handleSend on Enter key (without Shift)", () => {
    render(<ChatInput {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/ask cowriter/i);
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false, preventDefault: vi.fn() });
    expect(baseProps.handleSend).toHaveBeenCalled();
  });

  it("does not call handleSend on Enter+Shift", () => {
    render(<ChatInput {...baseProps} />);
    const textarea = screen.getByPlaceholderText(/ask cowriter/i);
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true, preventDefault: vi.fn() });
    expect(baseProps.handleSend).not.toHaveBeenCalled();
  });

  it("shows interimSpeech when provided", () => {
    render(<ChatInput {...baseProps} interimSpeech="Listening..." />);
    expect(screen.getByText("Listening...")).toBeInTheDocument();
  });

  it("calls toggleRecordingMode when mode button clicked", () => {
    render(<ChatInput {...baseProps} />);
    const modeBtn = screen.getAllByRole("button")[0];
    fireEvent.click(modeBtn);
    expect(baseProps.toggleRecordingMode).toHaveBeenCalled();
  });

  it("calls toggleListening when mic button clicked", () => {
    render(<ChatInput {...baseProps} />);
    const micBtn = screen.getAllByRole("button")[1];
    fireEvent.click(micBtn);
    expect(baseProps.toggleListening).toHaveBeenCalled();
  });

  it("shows countdown badge in auto-stop mode", () => {
    render(<ChatInput {...baseProps} recordingMode="auto-stop" countdown={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("send button is disabled when input is empty", () => {
    render(<ChatInput {...baseProps} input="" />);
    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  });

  it("send button is enabled when input is not empty", () => {
    render(<ChatInput {...baseProps} input="hi" />);
    expect(screen.getByRole("button", { name: /send message/i })).not.toBeDisabled();
  });
});
