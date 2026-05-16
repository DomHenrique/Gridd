
import { supabase } from '../lib/supabase';

export const uploadFile = async (file: File, clientName: string): Promise<string> => {
    // Sanitize filename and path
    const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `${sanitizedClientName}/${Date.now()}-${file.name.replace(/\s/g, '_')}`;

    const fileType = file.type || 'application/octet-stream';


    const { data, error } = await supabase.functions.invoke('storage-ops', {
        body: { action: 'upload', filename, fileType }
    });

    if (error) {
        console.error('Edge Function Error:');
        throw new Error('Failed to get upload URL');
    }

    const { url } = data;
    if (!url) throw new Error('No upload URL returned');

    // Upload to the presigned URL
    const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': fileType
        }
    });

    if (!uploadRes.ok) {
        console.error('Upload Failed:');
        throw new Error('Failed to upload file to storage');
    }

    // Construct the permanent public URL
    // The signed URL includes query parameters (signature, expiry), remove them.
    const permanentUrl = new URL(url);
    permanentUrl.search = ''; 
    
    return permanentUrl.toString();
};

export const deleteFile = async (fileUrl: string): Promise<void> => {
    // Extract key from URL
    // URL: http://endpoint/bucket/key
    // We need 'key'.
    // Assumption: The URL path is /bucket/key
    // This depends on how MinIO is set up (path style vs domain style). 
    // Our Edge function uses forcePathStyle, so it's /bucket/key.
    
    try {
        const urlObj = new URL(fileUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        // pathParts[0] is bucket, pathParts.slice(1) is key
        if(pathParts.length < 2) return;
        
        const key = pathParts.slice(1).join('/');

        const { error } = await supabase.functions.invoke('storage-ops', {
            body: { action: 'delete', filename: key }
        });

        if (error) throw error;
    } catch (e) {
        console.error("Failed to delete file from storage:");
        // We don't block DB deletion if storage deletion fails
    }
};

export const getFileUrl = async (fullUrl: string): Promise<string> => {
    try {
        const urlObj = new URL(fullUrl);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if(pathParts.length < 2) return fullUrl;

        const key = pathParts.slice(1).join('/');

        const { data, error } = await supabase.functions.invoke('get-file-url', {
             body: { filename: key }
        });

        if (error || !data?.url) return fullUrl;
        return data.url;
    } catch (e) {
        return fullUrl;
    }
}
