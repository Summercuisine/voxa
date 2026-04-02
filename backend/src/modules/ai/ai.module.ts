import { Module } from '@nestjs/common';
import { AIService, createAIEngineProvider, AI_ENGINE_TOKEN } from './ai.service.js';
import { AIEngine } from './ai-engine.interface.js';

@Module({
  providers: [createAIEngineProvider, AIService],
  exports: [AIService, { provide: AI_ENGINE_TOKEN, useExisting: AI_ENGINE_TOKEN }],
})
export class AIModule {}
