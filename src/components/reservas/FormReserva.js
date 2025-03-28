import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    MenuItem,
    FormControl,
    Select,
    styled,
    Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ptBR from 'date-fns/locale/pt-BR';
import api from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useFeedback } from '../common/Feedback';
import { format, isBefore, startOfDay } from 'date-fns';

// Componentes estilizados
const FormContainer = styled(Box)(({ theme }) => ({
    backgroundColor: '#0F1140',
    borderRadius: '10px',
    padding: '40px',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.25)',
}));

const PageTitle = styled(Typography)({
    color: '#0F1140',
    marginBottom: '24px',
    textAlign: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
});

const FormLabel = styled(Typography)({
    color: 'white',
    marginBottom: '8px',
    fontSize: '16px',
});

const StyledSelect = styled(Select)({
    backgroundColor: '#F2EEFF',
    borderRadius: '8px',
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    marginBottom: '20px',
});

const StyledTextField = styled(TextField)({
    backgroundColor: '#F2EEFF',
    borderRadius: '8px',
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            border: 'none',
        },
        '&:hover fieldset': {
            border: 'none',
        },
        '&.Mui-focused fieldset': {
            border: 'none',
        },
    },
    marginBottom: '20px',
    '& input': {
        padding: '15px',
    }
});

const StyledDatePicker = styled(DatePicker)({
    backgroundColor: '#F2EEFF',
    borderRadius: '8px',
    marginBottom: '20px',
    width: '100%',
    '& .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: 'none',
    },
    '& input': {
        padding: '15px',
    }
});

const ButtonContainer = styled(Box)({
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '30px',
    width: '100%',
});

const ActionButton = styled(Button)(({ variant }) => ({
    flex: 1,
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: 'bold',
    backgroundColor: variant === 'contained' ? '#F2EEFF' : 'transparent',
    color: variant === 'contained' ? '#0F1140' : '#F2EEFF',
    border: variant === 'contained' ? 'none' : '1px solid #F2EEFF',
    '&:hover': {
        backgroundColor: variant === 'contained' ? '#E5E0FF' : 'rgba(242, 238, 255, 0.1)',
    },
}));

const FormReserva = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { showFeedback, FeedbackComponent } = useFeedback();
    const [espacos, setEspacos] = useState([]);
    const [professores, setProfessores] = useState([]);
    const [formData, setFormData] = useState({
        espacoAcademico: '',
        professor: '',
        data: null,
        horaInicial: '',
        horaFinal: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Função para depuração
    const logError = (error, message) => {
        console.error(message, error);
        console.log('Detalhes do erro:');
        console.log('Status:', error.response?.status);
        console.log('Mensagem:', error.response?.data?.message || error.message);
        console.log('Dados:', error.response?.data);

        setError(`${message}: ${error.response?.data?.message || error.message}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([carregarEspacos(), carregarProfessores()]);

                if (id) {
                    await carregarReserva(id);
                }
            } catch (error) {
                logError(error, "Erro ao carregar dados iniciais");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const carregarEspacos = async () => {
        try {
            const response = await api.get('/espacos');
            setEspacos(response.data.filter(espaco => espaco.disponivel));
            return response;
        } catch (error) {
            logError(error, 'Erro ao carregar espaços');
            throw error;
        }
    };

    const carregarProfessores = async () => {
        try {
            const response = await api.get('/professores');
            setProfessores(response.data);
            return response;
        } catch (error) {
            logError(error, 'Erro ao carregar professores');
            throw error;
        }
    };

    const carregarReserva = async (reservaId) => {
        try {
            const response = await api.get(`/reservas/${reservaId}`);
            const reserva = response.data;

            // Converter strings para objetos Date
            const dataReserva = new Date(reserva.data);

            setFormData({
                espacoAcademico: reserva.espacoAcademico.id,
                professor: reserva.professor.id,
                data: dataReserva,
                horaInicial: reserva.horaInicial,
                horaFinal: reserva.horaFinal
            });

            return response;
        } catch (error) {
            logError(error, 'Erro ao carregar reserva');
            throw error;
        }
    };

    const validarHorario = (horaInicial, horaFinal) => {
        if (!horaInicial || !horaFinal) return true;

        const [horaIni, minIni] = horaInicial.split(':').map(Number);
        const [horaFim, minFim] = horaFinal.split(':').map(Number);

        // Validar horário de funcionamento (06:00 - 23:00)
        if (horaIni < 6 || horaIni > 23 || horaFim < 6 || horaFim > 23) {
            showFeedback('Horário deve estar entre 06:00 e 23:00', 'error');
            return false;
        }

        // Calcular duração em minutos
        const duracaoMinutos = (horaFim * 60 + minFim) - (horaIni * 60 + minIni);

        // Validar duração máxima (1h15)
        if (duracaoMinutos > 75 || duracaoMinutos <= 0) {
            showFeedback('A reserva deve ter no máximo 1 hora e 15 minutos', 'error');
            return false;
        }

        return true;
    };

    // Função para formatar data antes de enviar
    const formatarDataParaAPI = (data) => {
        if (!data) return '';
        return format(data, 'yyyy-MM-dd');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.data) {
            showFeedback('É necessário selecionar uma data', 'error');
            return;
        }

        if (!validarHorario(formData.horaInicial, formData.horaFinal)) {
            return;
        }

        try {
            const dadosReserva = {
                ...formData,
                data: formatarDataParaAPI(formData.data),
                espacoAcademico: { id: formData.espacoAcademico },
                professor: { id: formData.professor }
            };

            if (id) {
                await api.put(`/reservas/${id}`, dadosReserva);
                showFeedback('Reserva atualizada com sucesso', 'success');
            } else {
                await api.post('/reservas', dadosReserva);
                showFeedback('Reserva criada com sucesso', 'success');
            }
            navigate('/reservas');
        } catch (error) {
            console.error('Erro ao salvar reserva:', error);
            showFeedback(
                error.response?.data?.message || 'Erro ao salvar reserva',
                'error'
            );
        }
    };

    const handleCancel = () => {
        navigate('/reservas');
    };

    // Função para desabilitar datas passadas
    const desabilitarDataPassada = (date) => {
        return isBefore(date, startOfDay(new Date()));
    };

    // Função para validar entrada de hora
    const validarEntradaHora = (e, field) => {
        const value = e.target.value;
        
        if (value) {
            const [hora] = value.split(':').map(Number);
            
            if (hora < 6 || hora > 23) {
                showFeedback('Horário deve estar entre 06:00 e 23:00', 'warning');
            }
        }
        
        setFormData({ ...formData, [field]: value });
    };

    return (
        <Box sx={{ padding: 3 }}>
            <PageTitle>
                {id ? 'Editar Reserva' : 'Cadastrar Reserva'}
            </PageTitle>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        maxWidth: '600px',
                        margin: '0 auto 20px'
                    }}
                >
                    {error}
                </Alert>
            )}

            <FormContainer>
                <form onSubmit={handleSubmit}>
                    <FormLabel>Espaço Acadêmico</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            value={formData.espacoAcademico}
                            onChange={(e) => setFormData({ ...formData, espacoAcademico: e.target.value })}
                            required
                            disabled={loading}
                            displayEmpty
                            renderValue={(value) => {
                                if (!value) return "Espaço Acadêmico";
                                const espaco = espacos.find(e => e.id === value);
                                return espaco ? espaco.nome : "";
                            }}
                        >
                            {espacos.map(espaco => (
                                <MenuItem key={espaco.id} value={espaco.id}>
                                    {espaco.nome}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </FormControl>

                    <FormLabel>Professor</FormLabel>
                    <FormControl fullWidth>
                        <StyledSelect
                            value={formData.professor}
                            onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                            required
                            disabled={loading}
                            displayEmpty
                            renderValue={(value) => {
                                if (!value) return "Professor";
                                const professor = professores.find(p => p.id === value);
                                return professor ? professor.nome : "";
                            }}
                        >
                            {professores.map(professor => (
                                <MenuItem key={professor.id} value={professor.id}>
                                    {professor.nome}
                                </MenuItem>
                            ))}
                        </StyledSelect>
                    </FormControl>

                    <FormLabel>Data</FormLabel>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
                        <StyledDatePicker
                            value={formData.data}
                            onChange={(newDate) => setFormData({ ...formData, data: newDate })}
                            format="dd/MM/yyyy"
                            disablePast
                            shouldDisableDate={desabilitarDataPassada}
                            slotProps={{
                                textField: {
                                    required: true,
                                    placeholder: "DD/MM/AAAA",
                                    disabled: loading,
                                    fullWidth: true
                                }
                            }}
                        />
                    </LocalizationProvider>

                    <FormLabel>Horário Inicial</FormLabel>
                    <StyledTextField
                        type="time"
                        value={formData.horaInicial}
                        onChange={(e) => validarEntradaHora(e, 'horaInicial')}
                        required
                        fullWidth
                        inputProps={{
                            min: "06:00",
                            max: "23:00",
                            step: "300" // 5 minutos
                        }}
                    />

                    <FormLabel>Horário Final</FormLabel>
                    <StyledTextField
                        type="time"
                        value={formData.horaFinal}
                        onChange={(e) => validarEntradaHora(e, 'horaFinal')}
                        required
                        fullWidth
                        inputProps={{
                            min: "06:00",
                            max: "23:00",
                            step: "300" // 5 minutos
                        }}
                    />

                    <ButtonContainer>
                        <ActionButton
                            type="button"
                            onClick={handleCancel}
                            disabled={loading}
                            variant="outlined"
                        >
                            Cancelar
                        </ActionButton>
                        <ActionButton
                            type="submit"
                            disabled={loading}
                            variant="contained"
                        >
                            {loading ? 'Salvando...' : (id ? 'Atualizar' : 'Cadastrar')}
                        </ActionButton>
                    </ButtonContainer>
                </form>
            </FormContainer>
            {FeedbackComponent}
        </Box>
    );
};

export default FormReserva;