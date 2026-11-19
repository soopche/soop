import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { buildRemoteWizardMesh } from './world3d';
import { EQUIPMENT_CATALOG } from './spells';

function countGroupTriangles(root: THREE.Object3D): { meshes: number; triangles: number } {
  let meshes = 0;
  let triangles = 0;
  root.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      meshes += 1;
      const idx = child.geometry.getIndex();
      if (idx) {
        triangles += idx.count / 3;
      } else {
        const pos = child.geometry.getAttribute('position');
        if (pos) triangles += pos.count / 3;
      }
    }
  });
  return { meshes, triangles };
}

test('buildRemoteWizardMesh lightweight mode builds 5-mesh silhouette for medium/ultralow graphics', () => {
  const light = buildRemoteWizardMesh('wand_ollivander', false);
  const stats = countGroupTriangles(light);
  assert.equal(stats.meshes, 5);
  assert.ok(stats.triangles > 0 && stats.triangles < 400);
});

test('buildRemoteWizardMesh detailed mode builds <800-tri faceted Heroic Wizard grounded at y=0 with staff gem color', () => {
  const detailedYew = buildRemoteWizardMesh('wand_ancient_yew', true);
  detailedYew.updateMatrixWorld(true);

  const stats = countGroupTriangles(detailedYew);
  assert.ok(stats.meshes >= 20, `expected articulated wizard meshes, got ${stats.meshes}`);
  assert.ok(
    stats.triangles < 800,
    `expected detailed remote wizard under 800 triangles, got ${stats.triangles}`
  );

  // Every mesh material uses flatShading: true
  detailedYew.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      assert.equal(mat.flatShading, true);
    }
  });

  // Grounded flush at y=0 and fits cleanly below overhead HP bar (y=3.35)
  const box = new THREE.Box3().setFromObject(detailedYew);
  assert.ok(Math.abs(box.min.y) < 0.02, `expected boots grounded near y=0, got min.y=${box.min.y}`);
  assert.ok(box.max.y > 2.5 && box.max.y < 3.15, `expected height ~2.85m, got max.y=${box.max.y}`);

  // Staff crystal gem reflects EQUIPMENT_CATALOG[staffId].gemColor
  const yewGem = detailedYew.getObjectByName('staff_crystal_gem') as THREE.Mesh | undefined;
  assert.ok(yewGem, 'staff_crystal_gem must exist');
  const yewGemMat = yewGem.material as THREE.MeshStandardMaterial;
  assert.equal(
    `#${yewGemMat.color.getHexString()}`,
    EQUIPMENT_CATALOG.wand_ancient_yew.gemColor.toLowerCase()
  );

  // Unknown staffId falls back to '#38bdf8'
  const fallbackWizard = buildRemoteWizardMesh('unknown_staff_id', true);
  const fallbackGem = fallbackWizard.getObjectByName('staff_crystal_gem') as THREE.Mesh | undefined;
  assert.ok(fallbackGem);
  const fallbackGemMat = fallbackGem.material as THREE.MeshStandardMaterial;
  assert.equal(`#${fallbackGemMat.color.getHexString()}`, '#38bdf8');
});
