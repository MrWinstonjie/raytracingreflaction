// Lighting calculations using Phong model
const vec3 = glMatrix.vec3;

// Material properties
class Material {
    constructor(ambient, diffuse, specular, shininess) {
        if (!ambient || !diffuse || !specular) {
            throw new Error('Material requires ambient, diffuse, and specular properties');
        }
        this.ambient = ambient;
        this.diffuse = diffuse;
        this.specular = specular;
        this.shininess = shininess || 32.0;
    }
}

// Light properties
class Light {
    constructor(position, ambient, diffuse, specular) {
        if (!position) {
            throw new Error('Light requires position');
        }
        this.position = position;
        this.ambient = ambient || { r: 0.2, g: 0.2, b: 0.2 };
        this.diffuse = diffuse || { r: 0.8, g: 0.8, b: 0.8 };
        this.specular = specular || { r: 1.0, g: 1.0, b: 1.0 };
    }
}

// Calculate ambient component
function calculateAmbient(material, light) {
    if (!material || !light) {
        throw new Error('Material and light are required for ambient calculation');
    }
    return {
        r: material.ambient.r * light.ambient.r,
        g: material.ambient.g * light.ambient.g,
        b: material.ambient.b * light.ambient.b
    };
}

// Calculate diffuse component
function calculateDiffuse(material, light, normal, lightDir) {
    if (!material || !light || !normal || !lightDir) {
        throw new Error('All parameters are required for diffuse calculation');
    }
    const dotProduct = Math.max(dot(normal, lightDir), 0);
    return {
        r: material.diffuse.r * light.diffuse.r * dotProduct,
        g: material.diffuse.g * light.diffuse.g * dotProduct,
        b: material.diffuse.b * light.diffuse.b * dotProduct
    };
}

// Calculate specular component
function calculateSpecular(material, light, normal, lightDir, viewDir) {
    if (!material || !light || !normal || !lightDir || !viewDir) {
        throw new Error('All parameters are required for specular calculation');
    }
    const reflectDir = reflect(lightDir, normal);
    const spec = Math.pow(Math.max(dot(viewDir, reflectDir), 0), material.shininess);
    return {
        r: material.specular.r * light.specular.r * spec,
        g: material.specular.g * light.specular.g * spec,
        b: material.specular.b * light.specular.b * spec
    };
}

// Calculate reflection vector
function reflect(incident, normal) {
    if (!incident || !normal) {
        throw new Error('Incident and normal vectors are required');
    }
    const dotProduct = dot(incident, normal);
    return subtract(scale(normal, 2 * dotProduct), incident);
}

// Check if point is in shadow from a light
function isInShadow(point, lightPos, objects, currentObject) {
    // Calculate direction from point to light
    const lightDir = normalize(subtract(lightPos, point));
    
    // Create shadow ray (starting slightly above the surface to avoid self-intersection)
    const shadowRayOrigin = add(point, scale(lightDir, 0.001));
    const shadowRay = new Ray(shadowRayOrigin, lightDir);
    
    // Find intersections with all objects except the current one
    const distanceToLight = length(subtract(lightPos, point));
    
    for (const object of objects) {
        // Skip the current object to avoid self-shadowing
        if (object === currentObject) continue;
        
        let t;
        if (object instanceof Sphere) {
            t = intersectRaySphere(shadowRay, object);
        } else if (object instanceof Plane) {
            t = intersectRayPlane(shadowRay, object);
        }
        
        // If there's an intersection between the point and the light, it's in shadow
        if (t > 0.001 && t < distanceToLight) {
            return true;
        }
    }
    
    return false;
}

// Calculate final color using Phong model with multiple lights and shadows
function calculatePhongLighting(material, lights, normal, viewDir, point, objects, currentObject) {
    if (!material || !lights || !normal || !viewDir || !point || !objects) {
        throw new Error('All parameters are required for Phong lighting calculation');
    }
    
    // Start with ambient color from first light (we'll use this as global ambient)
    let finalColor = {
        r: material.ambient.r * lights[0].ambient.r,
        g: material.ambient.g * lights[0].ambient.g,
        b: material.ambient.b * lights[0].ambient.b
    };
    
    // Add contribution from each light
    for (const light of lights) {
        // Calculate direction from point to light
        const lightDir = normalize(subtract(light.position, point));
        
        // Check if point is in shadow from this light
        if (isInShadow(point, light.position, objects, currentObject)) {
            // Skip diffuse and specular for this light
            continue;
        }
        
        // Calculate diffuse component
        const diffuse = calculateDiffuse(material, light, normal, lightDir);
        
        // Calculate specular component
        const specular = calculateSpecular(material, light, normal, lightDir, viewDir);
        
        // Add diffuse and specular components from this light
        finalColor.r += diffuse.r + specular.r;
        finalColor.g += diffuse.g + specular.g;
        finalColor.b += diffuse.b + specular.b;
    }
    
    // Clamp final color to [0, 1]
    return {
        r: Math.min(finalColor.r, 1.0),
        g: Math.min(finalColor.g, 1.0),
        b: Math.min(finalColor.b, 1.0)
    };
} 