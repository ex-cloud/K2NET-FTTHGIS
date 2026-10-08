package logger

import (
	"context"
	"testing"
)

func TestLoggerInitializationAndContext(t *testing.T) {
	InitLogger()

	if Log == nil {
		t.Fatal("expected Log to be initialized, got nil")
	}

	// Test with plain context
	ctxPlain := context.Background()
	l1 := GetContextLogger(ctxPlain)
	if l1 == nil {
		t.Error("expected non-nil logger from plain context")
	}

	// Test with context containing correlation ID
	ctxWithCorr := context.WithValue(ctxPlain, "correlation_id", "trace-abc-123")
	l2 := GetContextLogger(ctxWithCorr)
	if l2 == nil {
		t.Error("expected non-nil logger from decorated context")
	}

	// Test logging helpers without panicking
	Info(ctxWithCorr, "test info log message")
	Warn(ctxWithCorr, "test warn log message")
	Error(ctxWithCorr, "test error log message")
}
