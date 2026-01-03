import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { adminAPI } from '../services/api';
import { 
  UserCheck, 
  UserX, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

const ApprovalsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await adminAPI.getRegistrationRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Chyba pri načítaní žiadostí:', error);
      toast.error('Nepodarilo sa načítať žiadosti');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      await adminAPI.approveRegistration(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
      toast.success('Registrácia bola schválená');
    } catch (error) {
      toast.error('Nepodarilo sa schváliť registráciu');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm('Naozaj chcete zamietnuť túto žiadosť?')) return;
    
    setProcessingId(requestId);
    try {
      await adminAPI.rejectRegistration(requestId);
      setRequests(requests.filter(r => r.id !== requestId));
      toast.success('Registrácia bola zamietnutá');
    } catch (error) {
      toast.error('Nepodarilo sa zamietnuť registráciu');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'teacher':
        return <Badge className="badge-teacher">Učiteľ</Badge>;
      default:
        return <Badge className="badge-student">Študent</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="approvals-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schvaľovanie registrácií</h1>
          <p className="text-slate-500">Žiadosti čakajúce na schválenie</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{requests.length}</p>
                  <p className="text-sm text-yellow-600">Čakajúce žiadosti</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Žiadne čakajúce žiadosti</h3>
                <p className="text-slate-500 text-sm">
                  Všetky registrácie boli spracované.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request, index) => (
              <Card 
                key={request.id} 
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
                data-testid={`request-card-${request.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-sky-400 flex items-center justify-center text-white font-semibold">
                        {request.first_name[0]}{request.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">
                          {request.first_name} {request.last_name}
                        </h3>
                        <p className="text-sm text-slate-500">{request.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(request.role_requested)}
                          {request.grade_name && (
                            <Badge className="bg-sky-900/50 text-sky-300">
                              {request.grade_name}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(request.created_at).toLocaleDateString('sk-SK', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        data-testid={`reject-btn-${request.id}`}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Zamietnuť
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id}
                        className="bg-green-500 hover:bg-green-600"
                        data-testid={`approve-btn-${request.id}`}
                      >
                        {processingId === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Schváliť
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApprovalsPage;
