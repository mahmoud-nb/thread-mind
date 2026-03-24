import type { ToolDefinition } from './types'

export const FILE_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the contents of a file at the given path relative to the project root. Returns the file content as text. Use this to understand existing code before making changes.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path from project root' },
        startLine: { type: 'number', description: 'Optional start line (1-indexed)' },
        endLine: { type: 'number', description: 'Optional end line (1-indexed)' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates parent directories if needed. Use for creating new files or completely replacing file contents.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path from project root' },
        content: { type: 'string', description: 'Full file content to write' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Apply a targeted edit to a file by specifying the exact text to find and its replacement. More precise than write_file for small changes.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path from project root' },
        search: { type: 'string', description: 'Exact text to find in the file' },
        replace: { type: 'string', description: 'Text to replace the found text with' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
  {
    name: 'list_directory',
    description: 'List files and directories at the given path. Returns names with type indicators (file/directory) and file sizes.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Relative path from project root. Use "" or "." for root.' },
        recursive: { type: 'boolean', description: 'If true, list recursively (max 3 levels). Default false.' },
      },
      required: ['path'],
    },
  },
  {
    name: 'search_files',
    description: 'Search for text content across files in the project. Returns matching file paths and line numbers with surrounding context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text or regex pattern to search for' },
        path: { type: 'string', description: 'Directory to search in (relative). Default: project root.' },
        glob: { type: 'string', description: 'File glob pattern to filter. E.g. "*.ts" or "src/**/*.vue"' },
      },
      required: ['query'],
    },
  },
]
