import fs from 'fs';

function readGlb(filepath) {
    const buffer = fs.readFileSync(filepath);
    const magic = buffer.toString('utf8', 0, 4);
    if (magic !== 'glTF') {
        console.log("Not a valid GLB");
        return;
    }
    const version = buffer.readUInt32LE(4);
    const length = buffer.readUInt32LE(8);

    const chunk0Length = buffer.readUInt32LE(12);
    const chunk0Type = buffer.toString('utf8', 16, 20);

    if (chunk0Type !== 'JSON') {
        console.log("Chunk 0 is not JSON");
        return;
    }

    const jsonStr = buffer.toString('utf8', 20, 20 + chunk0Length);
    const gltf = JSON.parse(jsonStr);

    const result = {
        version,
        components: Object.keys(gltf),
        nodes: gltf.nodes?.map((n, i) => `[${i}]: ${n.name || 'unnamed'}`) || [],
        meshes: gltf.meshes?.map((m, i) => `[${i}]: ${m.name || 'unnamed'}`) || [],
        animations: gltf.animations?.map((a, i) => `[${i}]: ${a.name || 'unnamed'}`) || [],
        materials: gltf.materials?.map((m, i) => `[${i}]: ${m.name || 'unnamed'}`) || []
    };
    fs.writeFileSync('gltf_info.json', JSON.stringify(result, null, 2), 'utf8');
}

readGlb('d:/CAPSTONE/Front-End/FE_SP26SE049/3D/Pronunciation.glb');
