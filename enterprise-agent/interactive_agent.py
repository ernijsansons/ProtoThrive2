#!/usr/bin/env python3
"""
Interactive Enterprise Agent - Talk directly to your agent!
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from agent_orchestrator import AgentOrchestrator

def main():
    print('🤖 Enterprise Agent Interactive Mode')
    print('=' * 50)
    print('Type your tasks and I\'ll help you with them!')
    print('Type "quit" or "exit" to stop.')
    print('=' * 50)

    orch = AgentOrchestrator()

    while True:
        try:
            task = input('\n💬 You: ')
            if task.lower() in ['quit', 'exit', 'q']:
                print('👋 Goodbye!')
                break
            
            if task.strip():
                print(f'\n🚀 Processing: {task}')
                print('-' * 50)
                result = orch.run_mode('coding', task)
                
                if result:
                    print('\n✅ Task Completed!')
                    if isinstance(result, dict):
                        if 'plan' in result and result['plan']:
                            print(f'📋 Plan: {result["plan"]}')
                        if 'code' in result and result['code']:
                            print(f'💻 Code: {result["code"]}')
                        if 'confidence' in result:
                            print(f'📊 Confidence: {result["confidence"]}')
                else:
                    print('❌ No result generated')
        except KeyboardInterrupt:
            print('\n👋 Goodbye!')
            break
        except Exception as e:
            print(f'❌ Error: {e}')

if __name__ == "__main__":
    main()

