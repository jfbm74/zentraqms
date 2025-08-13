/**
 * 🚀 Configuración de Release Automation
 * 
 * Configuración para semantic-release que automatiza:
 * - Generación de versiones semánticas
 * - Actualización de CHANGELOG
 * - Creación de releases en GitHub
 * - Publicación de packages
 */

module.exports = {
  branches: [
    'main',
    {
      name: 'develop',
      prerelease: 'dev'
    },
    {
      name: 'release/*',
      prerelease: 'rc'
    }
  ],
  plugins: [
    // Analizar commits para determinar tipo de release
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'revert', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'chore', release: false },
          { type: 'refactor', release: 'patch' },
          { type: 'test', release: false },
          { type: 'build', release: false },
          { type: 'ci', release: false },
          { breaking: true, release: 'major' }
        ],
        parserOpts: {
          noteKeywords: ['BREAKING CHANGE', 'BREAKING CHANGES']
        }
      }
    ],
    
    // Generar notas de release
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '🚀 Nuevas Funcionalidades' },
            { type: 'fix', section: '🐛 Correcciones' },
            { type: 'perf', section: '⚡ Mejoras de Performance' },
            { type: 'revert', section: '⏪ Reversiones' },
            { type: 'refactor', section: '🔧 Refactoring' },
            { type: 'security', section: '🛡️ Seguridad' },
            { type: 'docs', section: '📝 Documentación', hidden: false },
            { type: 'style', section: '🎨 Estilos', hidden: true },
            { type: 'chore', section: '🏗️ Mantenimiento', hidden: true },
            { type: 'test', section: '🧪 Tests', hidden: true },
            { type: 'build', section: '📦 Build', hidden: true },
            { type: 'ci', section: '👷 CI/CD', hidden: true }
          ]
        }
      }
    ],
    
    // Actualizar CHANGELOG.md
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
        changelogTitle: `# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).`
      }
    ],
    
    // Actualizar package.json
    '@semantic-release/npm',
    
    // Ejecutar scripts personalizados
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'node scripts/sync-versions.js'
      }
    ],
    
    // Crear commit con cambios
    [
      '@semantic-release/git',
      {
        assets: [
          'package.json',
          'frontend/package.json',
          'CHANGELOG.md'
        ],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    
    // Crear release en GitHub
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false,
        releasedLabels: false,
        addReleases: 'top'
      }
    ]
  ]
};