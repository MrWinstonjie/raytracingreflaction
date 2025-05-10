// Vector and Matrix operations using gl-matrix
const vec3 = glMatrix.vec3;
const mat4 = glMatrix.mat4;

// Vector operations
function add(a, b) {
    return vec3.add(vec3.create(), a, b);
}

function subtract(a, b) {
    return vec3.subtract(vec3.create(), a, b);
}

function scale(v, s) {
    return vec3.scale(vec3.create(), v, s);
}

function normalize(v) {
    return vec3.normalize(vec3.create(), v);
}

function dot(a, b) {
    return vec3.dot(a, b);
}

function length(v) {
    return vec3.length(v);
}

// Ray structure
class Ray {
    constructor(origin, direction) {
        this.origin = origin;
        this.direction = direction;
    }
}

// Sphere structure
class Sphere {
    constructor(center, radius, material) {
        if (!center || !radius) {
            throw new Error('Sphere requires center and radius');
        }
        this.center = center;
        this.radius = radius;
        this.material = material;
    }

    // Calculate normal at intersection point
    getNormal(intersectionPoint) {
        if (!intersectionPoint) {
            throw new Error('Intersection point is required');
        }
        return normalize(subtract(intersectionPoint, this.center));
    }

    // Calculate intersection point
    getIntersectionPoint(ray, t) {
        if (!ray || t === undefined) {
            throw new Error('Ray and t parameter are required');
        }
        return add(ray.origin, scale(ray.direction, t));
    }
}

// Plane structure
class Plane {
    constructor(point, normal, material) {
        if (!point || !normal) {
            throw new Error('Plane requires point and normal');
        }
        this.point = point;
        this.normal = normalize(normal);
        this.material = material;
    }

    // Normal is the same everywhere on the plane
    getNormal() {
        return this.normal;
    }

    // Calculate intersection point
    getIntersectionPoint(ray, t) {
        if (!ray || t === undefined) {
            throw new Error('Ray and t parameter are required');
        }
        return add(ray.origin, scale(ray.direction, t));
    }
}

// Ray-Sphere intersection
function intersectRaySphere(ray, sphere) {
    if (!ray || !sphere) {
        throw new Error('Ray and sphere are required');
    }
    
    const oc = subtract(ray.origin, sphere.center);
    const a = dot(ray.direction, ray.direction);
    const b = 2.0 * dot(oc, ray.direction);
    const c = dot(oc, oc) - sphere.radius * sphere.radius;
    const discriminant = b * b - 4 * a * c;

    if (discriminant < 0) {
        return -1; // No intersection
    }

    const t = (-b - Math.sqrt(discriminant)) / (2.0 * a);
    return t;
}

// Ray-Plane intersection
function intersectRayPlane(ray, plane) {
    if (!ray || !plane) {
        throw new Error('Ray and plane are required');
    }

    const denom = dot(ray.direction, plane.normal);
    
    // Check if ray is parallel to the plane (or nearly parallel)
    if (Math.abs(denom) < 0.0001) {
        return -1; // No intersection or infinite intersections
    }
    
    const v = subtract(plane.point, ray.origin);
    const t = dot(v, plane.normal) / denom;
    
    return t > 0 ? t : -1;
}

// Find closest intersection among multiple objects (spheres and planes)
function findClosestIntersection(ray, objects) {
    if (!ray || !objects || !Array.isArray(objects)) {
        throw new Error('Ray and objects array are required');
    }

    let closestT = Infinity;
    let closestObject = null;
    let intersectionPoint = null;

    for (const object of objects) {
        let t;
        if (object instanceof Sphere) {
            t = intersectRaySphere(ray, object);
        } else if (object instanceof Plane) {
            t = intersectRayPlane(ray, object);
        } else {
            continue; // Skip unknown object types
        }

        if (t > 0.001 && t < closestT) { // Small offset to avoid self-shadowing
            closestT = t;
            closestObject = object;
            intersectionPoint = object.getIntersectionPoint(ray, t);
        }
    }

    return { 
        t: closestT, 
        object: closestObject,
        point: intersectionPoint
    };
} 