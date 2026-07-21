import { useState } from 'react';
import { reservationAPI } from '../services/api';
import { emptyReservationForm, validateReservationForm } from '../utils/reservationForm';

/**
 * Centralise le comportement commun des formulaires de réservation publique.
 * Chaque page conserve son rendu et son payload métier propres.
 */
export default function useReservationForm({
  validateOptions,
  buildPayload,
  onSuccess,
  errorSelector,
}) {
  const [form, setForm] = useState(emptyReservationForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [simData, setSimData] = useState(null);

  const scrollToError = () => {
    document.querySelector(errorSelector)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    if ((name === 'departureAddress' || name === 'arrivalAddress') && simData) setSimData(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    const validationErrors = validateReservationForm(form, validateOptions);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      scrollToError();
      return;
    }

    setLoading(true);
    try {
      const { data } = await reservationAPI.create(buildPayload({ form, simData }));
      onSuccess({ data, form, simData });
    } catch (error) {
      const backendFields = error.response?.data?.fields;
      if (backendFields) {
        setErrors((current) => ({ ...current, ...backendFields }));
        scrollToError();
      }
      setServerError(error.response?.data?.error || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return {
    form,
    setForm,
    errors,
    setErrors,
    loading,
    serverError,
    simData,
    setSimData,
    handleChange,
    handleSubmit,
  };
}
