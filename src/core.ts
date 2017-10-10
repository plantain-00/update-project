export function getUpdatedVersion(currentVersion: string, latestVersion: string): string {
    if (currentVersion === "*") {
        return "*";
    }
    if (!currentVersion.includes("-")) {
        if (currentVersion.startsWith("^")) {
            const currentVersionParts = currentVersion.substring(1).split(".");
            if (currentVersionParts.length === 2) {
                const latestVersionParts = latestVersion.split(".");
                if (latestVersionParts[0] === currentVersionParts[0]) {
                    return currentVersion;
                } else {
                    return latestVersionParts[0];
                }
            }
        } else {
            const currentVersionParts = currentVersion.split(".");
            const latestVersionParts = latestVersion.split(".");
            if (currentVersionParts.length === 1) {
                return latestVersionParts[0];
            } else if (currentVersionParts.length === 2) {
                if (currentVersionParts[0] === "0") {
                    if (latestVersionParts[0] === currentVersionParts[0]) {
                        return latestVersionParts[0] + "." + latestVersionParts[1];
                    } else {
                        return latestVersionParts[0];
                    }
                }
            }
        }
    }
    return latestVersion;
}
