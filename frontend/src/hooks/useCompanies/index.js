import api from "../../services/api";

const useCompanies = () => {

    const save = async (data) => {
        const { data: responseData } = await api.request({
            url: '/companies',
            method: 'POST',
            data
        });
        return responseData;
    }

    const findAll = async (id) => {
        const { data } = await api.request({
            url: `/companies`,
            method: 'GET'
        });
        return data;
    }

    const list = async (id) => {
        const { data } = await api.request({
            url: `/companies/list`,
            method: 'GET'
        });
        return data;
    }

    const find = async (id) => {
        const { data } = await api.request({
            url: `/companies/${id}`,
            method: 'GET'
        });
        return data;
    }

    const finding = async (id) => {
        const { data } = await api.request({
            url: `/companies/${id}`,
            method: 'GET'
        });
        return data;
    }


    const update = async (data) => {
        const { data: responseData } = await api.request({
            url: `/companies/${data.id}`,
            method: 'PUT',
            data
        });
        return responseData;
    }

    const remove = async (id) => {
        const { data } = await api.request({
            url: `/companies/${id}`,
            method: 'DELETE'
        });
        return data;
    }

    const activate = async (data) => {
        const { data: responseData } = await api.request({
            url: `/companies/${data.id}/activate`,
            method: 'POST',
            data: {
                planId: data.planId,
                trialDays: data.trialDays,
                operationEnabled: data.operationEnabled
            }
        });
        return responseData;
    }

    const updateSchedules = async (data) => {
        const { data: responseData } = await api.request({
            url: `/companies/${data.id}/schedules`,
            method: 'PUT',
            data
        });
        return responseData;
    }

    return {
        save,
        update,
        remove,
        list,
        find,
        finding,
        findAll,
        updateSchedules,
        activate
    }
}

export default useCompanies;