package logger

import (
	"context"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var Log *zap.Logger

func InitLogger() {
	config := zap.NewProductionConfig()
	config.EncoderConfig.TimeKey = "timestamp"
	config.EncoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder
	
	// Output to stdout for systemd/loki ingestion
	var err error
	Log, err = config.Build()
	if err != nil {
		panic("Failed to initialize Zap logger: " + err.Error())
	}
	zap.ReplaceGlobals(Log)
}

// GetContextLogger extracts or decorates fields with X-Correlation-ID
func GetContextLogger(ctx context.Context) *zap.Logger {
	if Log == nil {
		InitLogger()
	}
	
	correlationID, ok := ctx.Value("correlation_id").(string)
	if ok && correlationID != "" {
		return Log.With(zap.String("correlation_id", correlationID))
	}
	return Log
}

// Info logs info messages with context
func Info(ctx context.Context, msg string, fields ...zap.Field) {
	GetContextLogger(ctx).Info(msg, fields...)
}

// Error logs error messages with context
func Error(ctx context.Context, msg string, fields ...zap.Field) {
	GetContextLogger(ctx).Error(msg, fields...)
}

// Warn logs warn messages with context
func Warn(ctx context.Context, msg string, fields ...zap.Field) {
	GetContextLogger(ctx).Warn(msg, fields...)
}
