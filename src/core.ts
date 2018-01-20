export function getUpdatedVersion (currentVersion: string, latestVersion: string): string {
  if (currentVersion === '*') {
    return '*'
  }

  if (currentVersion.includes('-')) {
    return latestVersion
  }

  const [latestMajor, latestMinor] = latestVersion.split('.')

  if (currentVersion.startsWith('^')) {
    const caretVersionParts = currentVersion.substring(1).split('.')
    if (caretVersionParts.length === 2) {
      if (latestMajor === caretVersionParts[0]) {
        return currentVersion
      } else {
        return latestMajor
      }
    }
    return latestVersion
  }

  if (currentVersion.includes('||') && !currentVersion.includes('.')) {
    const verticalBarVersionParts = currentVersion.split('||').map(c => +c)
    if (verticalBarVersionParts.every(p => !isNaN(p))) {
      verticalBarVersionParts.sort((a, b) => a - b)
      for (let i = verticalBarVersionParts[verticalBarVersionParts.length - 1] + 1; i <= +latestMajor; i++) {
        verticalBarVersionParts.push(i)
      }
      return verticalBarVersionParts.join(' || ')
    }
    return latestVersion
  }

  const currentVersionParts = currentVersion.split('.')

  if (currentVersionParts.length === 1) {
    return latestMajor
  } else if (currentVersionParts.length === 2) {
    if (currentVersionParts[0] === '0') {
      if (latestMajor === currentVersionParts[0]) {
        return latestMajor + '.' + latestMinor
      } else {
        return latestMajor
      }
    }
  }

  return latestVersion
}
