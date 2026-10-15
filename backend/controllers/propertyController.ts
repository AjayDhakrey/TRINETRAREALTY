import { Request, Response } from 'express';
import * as store from '../db/store';
import { Property } from '../../shared/types/realestate';
import { INITIAL_PROPERTIES } from '../../frontend/src/data/seedData';
import { broadcastEvent } from '../services/realtimeService';

export async function getProperties(req: Request, res: Response): Promise<void> {
  try {
    const {
      transactionType,
      category,
      locality,
      minPrice,
      maxPrice,
      bedrooms,
      search,
    } = req.query;

    const result = await store.getProperties({
      transactionType: typeof transactionType === 'string' ? transactionType : undefined,
      category: typeof category === 'string' ? category : undefined,
      locality: typeof locality === 'string' ? locality : undefined,
      minPrice: typeof minPrice === 'string' ? minPrice : undefined,
      maxPrice: typeof maxPrice === 'string' ? maxPrice : undefined,
      bedrooms: typeof bedrooms === 'string' ? bedrooms : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch properties', details: err.message });
  }
}

export async function getPropertyById(req: Request, res: Response): Promise<void> {
  try {
    const property = await store.getPropertyById(req.params.id);
    if (!property) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    res.json(property);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch property', details: err.message });
  }
}

export async function createProperty(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as Partial<Property>;
    if (!body.title || !body.price || !body.areaSqFt || !body.locality) {
      res.status(400).json({ error: 'Title, price, area, and locality are required.' });
      return;
    }

    const price = Number(body.price);
    const areaSqFt = Number(body.areaSqFt) || 1000;
    const pricePerSqFt = Math.round(price / areaSqFt);
    const existingList = await store.getProperties({});
    const nextNum = 150 + existingList.length;

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      code: body.code || `AV-0${nextNum}`,
      title: body.title.trim(),
      subtitle:
        body.subtitle?.trim() ||
        `${body.architecturalStyle || 'Contemporary Architectural'} residence in ${body.locality}`,
      transactionType: body.transactionType === 'Rent' ? 'Rent' : 'Buy',
      category: body.category || 'Penthouse',
      status: body.status || 'Available',
      price,
      pricePerSqFt,
      areaSqFt,
      bedrooms: body.bedrooms !== undefined ? Number(body.bedrooms) : 3,
      bathrooms: body.bathrooms !== undefined ? Number(body.bathrooms) : 3,
      parkingSpaces: body.parkingSpaces !== undefined ? Number(body.parkingSpaces) : 2,
      locality: body.locality,
      address: body.address?.trim() || `${body.locality} Private Enclave`,
      architecturalStyle: body.architecturalStyle?.trim() || 'Contemporary Minimalist',
      architect: body.architect?.trim() || 'Trinetra Realty Design Group',
      yearBuilt: body.yearBuilt !== undefined ? Number(body.yearBuilt) : 2026,
      monthlyMaintenance: body.monthlyMaintenance !== undefined ? Number(body.monthlyMaintenance) : 0,
      furnishedStatus: body.furnishedStatus || 'Bespoke Millwork',
      featured: Boolean(body.featured),
      images:
        Array.isArray(body.images) &&
        body.images.filter((img) => typeof img === 'string' && img.trim().length > 0).length > 0
          ? body.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0)
          : [INITIAL_PROPERTIES[0].images[0]],
      description:
        body.description?.trim() ||
        'An architecturally significant residence curated by Trinetra Realty Private Advisory.',
      amenities:
        Array.isArray(body.amenities) && body.amenities.length > 0
          ? body.amenities
          : ['Private Elevator', 'Architectural Lighting', 'Concierge Security'],
      highlights:
        Array.isArray(body.highlights) && body.highlights.length > 0
          ? body.highlights
          : [
              'Curated architectural material palette',
              'Expansive natural daylight orientation',
              'Private outdoor terrace integration',
            ],
      createdAt: new Date().toISOString(),
    };

    const created = await store.createProperty(newProperty);
    broadcastEvent('property:created', created);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('❌ Error creating property:', err);
    res.status(500).json({ error: 'Failed to create property', details: err.message });
  }
}

export async function updateProperty(req: Request, res: Response): Promise<void> {
  try {
    const existing = await store.getPropertyById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    const updates = req.body as Partial<Property>;
    const price = updates.price !== undefined ? Number(updates.price) : existing.price;
    const areaSqFt =
      updates.areaSqFt !== undefined ? Number(updates.areaSqFt) : existing.areaSqFt;
    const pricePerSqFt = areaSqFt > 0 ? Math.round(price / areaSqFt) : existing.pricePerSqFt;

    const sanitizedUpdates: Partial<Property> = {
      ...updates,
      price,
      areaSqFt,
      pricePerSqFt,
      bedrooms:
        updates.bedrooms !== undefined ? Number(updates.bedrooms) : existing.bedrooms,
      bathrooms:
        updates.bathrooms !== undefined ? Number(updates.bathrooms) : existing.bathrooms,
      parkingSpaces:
        updates.parkingSpaces !== undefined
          ? Number(updates.parkingSpaces)
          : existing.parkingSpaces,
      yearBuilt:
        updates.yearBuilt !== undefined ? Number(updates.yearBuilt) : existing.yearBuilt,
      monthlyMaintenance:
        updates.monthlyMaintenance !== undefined
          ? Number(updates.monthlyMaintenance)
          : existing.monthlyMaintenance,
    };

    const updated = await store.updateProperty(req.params.id, sanitizedUpdates);
    if (!updated) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }

    broadcastEvent('property:updated', updated);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update property', details: err.message });
  }
}

export async function deleteProperty(req: Request, res: Response): Promise<void> {
  try {
    const deleted = await store.deleteProperty(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Property not found' });
      return;
    }
    broadcastEvent('property:deleted', { id: req.params.id });
    res.json({ deleted: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete property', details: err.message });
  }
}

