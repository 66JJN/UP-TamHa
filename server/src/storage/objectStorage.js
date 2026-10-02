import { createReadStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { BlobServiceClient } from '@azure/storage-blob';
import { env } from '../config/env.js';

const uploadRoot = path.resolve(process.cwd(), 'uploads');

export async function saveObject(file) {
  const extension = file.mimetype === 'image/png' ? '.png' : file.mimetype === 'image/webp' ? '.webp' : '.jpg';
  const blobName = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${extension}`;
  if (env.storageConnectionString) {
    const service = BlobServiceClient.fromConnectionString(env.storageConnectionString);
    const container = service.getContainerClient(env.storageContainer);
    await container.createIfNotExists();
    const blob = container.getBlockBlobClient(blobName);
    await blob.uploadData(file.buffer, { blobHTTPHeaders: { blobContentType: file.mimetype } });
    return { blobName, localPath: null };
  }
  const localPath = path.join(uploadRoot, ...blobName.split('/'));
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, file.buffer);
  return { blobName, localPath };
}

export async function openObject(record) {
  if (env.storageConnectionString) {
    const service = BlobServiceClient.fromConnectionString(env.storageConnectionString);
    const blob = service.getContainerClient(env.storageContainer).getBlockBlobClient(record.blob_name);
    const response = await blob.download();
    return response.readableStreamBody;
  }
  return createReadStream(record.local_path || path.join(uploadRoot, ...record.blob_name.split('/')));
}

