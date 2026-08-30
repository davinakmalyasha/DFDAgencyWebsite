export class DriveService {
    static async createFolderForOrder(orderId: string, clientEmail?: string | null): Promise<{ folderId: string; folderUrl: string } | null> {
        const saJson = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON;
        const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
        if (!saJson) {
            console.log('[DriveService] GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON not set — skipping auto folder');
            return null;
        }
        try {
            const { google } = await import('googleapis');
            const credentials = JSON.parse(saJson);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive'],
            });
            const drive = google.drive({ version: 'v3', auth });
            const file: any = await drive.files.create({
                requestBody: {
                    name: `DFD-${orderId}`,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: parentFolderId ? [parentFolderId] : undefined,
                },
                fields: 'id, webViewLink',
            });
            const folderId = file.data.id as string;
            const folderUrl = file.data.webViewLink || `https://drive.google.com/drive/folders/${folderId}`;
            if (clientEmail) {
                try {
                    await drive.permissions.create({
                        fileId: folderId,
                        requestBody: { role: 'writer', type: 'user', emailAddress: clientEmail },
                        sendNotificationEmail: false,
                    });
                } catch (e) { console.warn('[DriveService] permission grant failed', e); }
            }
            return { folderId, folderUrl };
        } catch (e) {
            console.error('[DriveService] createFolder failed', e);
            return null;
        }
    }
}
