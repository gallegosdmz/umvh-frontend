import { useState } from 'react';
import { periodService } from '@/lib/services/period.service';
import { Period } from '@/lib/mock-data';
import { toast } from 'react-toastify';

export const usePeriod = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalItems, setTotalItems] = useState(0);

    const handleGetPeriods = async (limit?: number, offset?: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await periodService.getPeriods(limit, offset);
            const items = Array.isArray(data) ? data : data.items;
            setTotalItems(items.length);
            return items;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al obtener los períodos');
            return [];
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePeriod = async (period: Period) => {
        try {
            setLoading(true);
            setError(null);
            const newPeriod = await periodService.createPeriod(period);
            toast.success('Periodo creado correctamente');

            return newPeriod;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear el período');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePeriod = async (id: number, period: Period) => {
        try {
            setLoading(true);
            setError(null);
            const updatedPeriod = await periodService.updatePeriod(id, period);
            toast.success('Periodo editado correctamente');

            return updatedPeriod;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar el período');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePeriod = async (id: number) => {
        try {
            setLoading(true);
            setError(null);
            await periodService.deletePeriod(id);

            toast.success('Periodo eliminado correctamente');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar el período');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        totalItems,
        handleGetPeriods,
        handleCreatePeriod,
        handleUpdatePeriod,
        handleDeletePeriod
    };
}; 