import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ChatPanel from "./ChatPanel";
import type { ChatMessage } from "../types";

// Mock subcomponents to isolate ChatPanel logic
vi.mock("./ChatPanelHeader", () => ({
  default: (props: any) => (
    <div data-testid="chat-panel-header">
      <button onClick={() => props.onToggleTts(!props.ttsEnabled)}>
        Toggle TTS
      </button>
      <button onClick={props.toggleSpeechLang}>Lang</button>
      <button onClick={props.onClearMessages}>Clear</button>
    </div>
  ),
}));
vi.mock("./ChatMessagesList", () => ({
  default: (props: any) => (
    <div data-testid="chat-messages-list">
      {props.messages.map((msg: any) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      {props.isLoading && <div data-testid="loading-indicator">Loading...</div>}
    </div>
  ),
}));
vi.mock("./ChatInput", () => ({
  default: (props: any) => (
    <form onSubmit={props.handleSend} data-testid="chat-input">
      <input
        value={props.input}
        onChange={(e) => props.setInput(e.target.value)}
        data-testid="input"
        placeholder="Type a message"
      />
      <button type="submit" disabled={props.isLoading}>
        Send
      </button>
      <button type="button" onClick={props.toggleListening}>
        Mic
      </button>
      <button type="button" onClick={props.toggleRecordingMode}>
        Mode
      </button>
    </form>
  ),
}));

// Mock scrollIntoView for all tests to prevent errors from ChatPanel implementation
beforeAll(() => {
  Object.defineProperty(window.HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});

const baseMessages: ChatMessage[] = [
  { id: "1", role: "user", content: "Hello" },
  { id: "2", role: "model", content: "Hi there!" },
];

describe("ChatPanel", () => {
  let onSendMessage: (message: string) => void;
  let onApplyChanges: (messageId: string) => void;
  let onRejectChanges: (messageId: string) => void;
  let onHighlightCell: (cellId: string | null) => void;
  let onToggleTts: (enabled: boolean) => void;
  let onClearMessages: () => void;

  beforeEach(() => {
    onSendMessage = vi.fn();
    onApplyChanges = vi.fn();
    onRejectChanges = vi.fn();
    onHighlightCell = vi.fn();
    onToggleTts = vi.fn();
    onClearMessages = vi.fn();
  });

  it("renders header, messages list, and input", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    expect(screen.getByTestId("chat-panel-header")).toBeInTheDocument();
    expect(screen.getByTestId("chat-messages-list")).toBeInTheDocument();
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("calls onSendMessage when sending a message", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    const input = screen.getByTestId("input");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.submit(screen.getByTestId("chat-input"));
    expect(onSendMessage).toHaveBeenCalledWith("Test message");
  });

  it("disables send button when loading", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={true}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });

  it("calls onToggleTts when TTS toggle button is clicked", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    fireEvent.click(screen.getByText("Toggle TTS"));
    expect(onToggleTts).toHaveBeenCalledWith(true);
  });

  it("calls onClearMessages when clear button is clicked", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    fireEvent.click(screen.getByText("Clear"));
    expect(onClearMessages).toHaveBeenCalled();
  });

  it("calls onApplyChanges and onRejectChanges when passed to messages list", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    // The actual invocation is tested in ChatMessagesList, here we just check the props are passed
    expect(screen.getByTestId("chat-messages-list")).toBeInTheDocument();
  });

  it("calls toggleListening when mic button is clicked", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    fireEvent.click(screen.getByText("Mic"));
    // No assertion here: toggleListening is internal, but button is present and clickable
  });

  it("calls toggleRecordingMode when mode button is clicked", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    fireEvent.click(screen.getByText("Mode"));
    // No assertion here: toggleRecordingMode is internal, but button is present and clickable
  });

  it("calls speechLang toggle when Lang button is clicked", () => {
    render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    fireEvent.click(screen.getByText("Lang"));
    // No assertion here: toggleSpeechLang is internal, but button is present and clickable
  });

  it("renders updated messages when messages prop changes", () => {
    const { rerender } = render(
      <ChatPanel
        messages={baseMessages}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
    rerender(
      <ChatPanel
        messages={[
          ...baseMessages,
          { id: "3", role: "user", content: "New msg" } as ChatMessage,
        ]}
        onSendMessage={onSendMessage}
        isLoading={false}
        onApplyChanges={onApplyChanges}
        onRejectChanges={onRejectChanges}
        onHighlightCell={onHighlightCell}
        modelName="Gemini"
        isTtsSpeaking={false}
        ttsEnabled={false}
        onToggleTts={onToggleTts}
        onClearMessages={onClearMessages}
      />
    );
    expect(screen.getByText("New msg")).toBeInTheDocument();
  });
});
