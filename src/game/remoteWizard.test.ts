import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
  buildRemoteWizardMesh,
  buildRollingBoulderMesh,
  buildSkeletonShieldBarrierMesh,
  buildEarthquakeLineVisual,
  isMobileTouchDevice,
  computeRendererGraphicsConfig,
} from './world3d';
import { EQUIPMENT_CATALOG, STONE_CRUSHER_BOULDER_RADIUS } from './spells';

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

test('buildRollingBoulderMesh creates giant ~1.45m radius granite boulder with glowing orange crack crystals inside rollPivot', () => {
  const { group, rollPivot } = buildRollingBoulderMesh();
  group.updateMatrixWorld(true);
  assert.equal(group.children.includes(rollPivot), true);

  const core = rollPivot.getObjectByName('boulder_granite_core') as THREE.Mesh | undefined;
  assert.ok(core, 'granite core mesh must exist');

  const coreBox = new THREE.Box3().setFromObject(core);
  const halfHeight = (coreBox.max.y - coreBox.min.y) / 2;
  assert.ok(
    Math.abs(halfHeight - STONE_CRUSHER_BOULDER_RADIUS) < 0.2,
    `expected boulder core radius ~${STONE_CRUSHER_BOULDER_RADIUS}, got ${halfHeight}`
  );

  const stats = countGroupTriangles(group);
  assert.ok(stats.meshes >= 7, 'boulder should include granite core plus crack crystals');
});

test('buildSkeletonShieldBarrierMesh creates curved translucent cyan-gold barrier strictly in front (+Z) and hidden by default', () => {
  const barrier = buildSkeletonShieldBarrierMesh();
  assert.equal(barrier.visible, false, 'shield barrier must start hidden');
  const mat = barrier.material as THREE.MeshStandardMaterial;
  assert.equal(mat.transparent, true);
  assert.equal(mat.opacity, 0.42);
  assert.equal(mat.emissive.getHex(), 0x38bdf8);

  barrier.visible = true;
  barrier.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(barrier);
  assert.ok(box.min.z > 0, `curved shield arc must stay in front (+Z) of skeleton, got min.z=${box.min.z}`);
  assert.ok(box.max.z > 1.1, `curved shield arc must protrude forward along +Z, got max.z=${box.max.z}`);
});

test('buildEarthquakeLineVisual places warning strip and hidden rock spikes strictly FORWARD along +Z', () => {
  const length = 14.5;
  const width = 2.6;
  const { group, stripMesh, spikesGroup } = buildEarthquakeLineVisual(length, width);
  group.updateMatrixWorld(true);

  assert.equal(spikesGroup.visible, false, 'earthquake rock spikes must start hidden during telegraph');

  const stripBox = new THREE.Box3().setFromObject(stripMesh);
  assert.ok(
    stripBox.min.z >= -0.01 && stripBox.max.z >= length - 0.05,
    `earthquake floor strip must extend strictly forward along +Z [0, ${length}], got [${stripBox.min.z}, ${stripBox.max.z}]`
  );

  spikesGroup.visible = true;
  group.updateMatrixWorld(true);
  const spikesBox = new THREE.Box3().setFromObject(spikesGroup);
  assert.ok(
    spikesBox.min.z > 0 && spikesBox.max.z <= length,
    `earthquake rock spikes must align strictly forward along +Z, got [${spikesBox.min.z}, ${spikesBox.max.z}]`
  );
});

test('computeRendererGraphicsConfig caps mobile high DPR at 1.35 and disables shadows while preserving desktop settings', () => {
  const mobileHigh = computeRendererGraphicsConfig('high', 3, false, true);
  assert.equal(mobileHigh.pixelRatio, 1.35);
  assert.equal(mobileHigh.shadowsEnabled, false);
  assert.equal(mobileHigh.cameraFar, 160);

  const mobileLowDpr = computeRendererGraphicsConfig('high', 1.0, false, true);
  assert.equal(mobileLowDpr.pixelRatio, 1.0);
  assert.equal(mobileLowDpr.shadowsEnabled, false);

  const desktopHigh = computeRendererGraphicsConfig('high', 3, false, false);
  assert.equal(desktopHigh.pixelRatio, 2);
  assert.equal(desktopHigh.shadowsEnabled, true);

  const swGlHigh = computeRendererGraphicsConfig('high', 2, true, false);
  assert.equal(swGlHigh.pixelRatio, 1);
  assert.equal(swGlHigh.shadowsEnabled, false);

  const med = computeRendererGraphicsConfig('medium', 2, false, true);
  assert.equal(med.pixelRatio, 0.85);
  assert.equal(med.shadowsEnabled, false);

  const ultra = computeRendererGraphicsConfig('ultralow', 2, false, true);
  assert.equal(ultra.pixelRatio, 0.5);
  assert.equal(ultra.shadowsEnabled, false);
  assert.equal(ultra.imageRendering, 'pixelated');
});

test('isMobileTouchDevice detects coarse pointer and touch points safely', () => {
  const g = globalThis as unknown as {
    window?: Record<string, unknown>;
    navigator?: Record<string, unknown>;
  };
  const prevWindow = g.window;
  const prevNavigator = g.navigator;
  const navDesc = Object.getOwnPropertyDescriptor(globalThis, 'navigator');

  try {
    g.window = { matchMedia: () => ({ matches: false }) };
    Object.defineProperty(globalThis, 'navigator', {
      value: { maxTouchPoints: 0 },
      configurable: true,
      writable: true,
    });
    assert.equal(isMobileTouchDevice(), false);

    g.window = { matchMedia: () => ({ matches: true }) };
    assert.equal(isMobileTouchDevice(), true);

    g.window = { matchMedia: () => ({ matches: false }) };
    Object.defineProperty(globalThis, 'navigator', {
      value: { maxTouchPoints: 5 },
      configurable: true,
      writable: true,
    });
    assert.equal(isMobileTouchDevice(), true);
  } finally {
    g.window = prevWindow;
    if (navDesc) {
      Object.defineProperty(globalThis, 'navigator', navDesc);
    } else {
      g.navigator = prevNavigator;
    }
  }
});


